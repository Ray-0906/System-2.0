/**
 * AssistantService — AI Growth Assistant with full player context.
 *
 * Unified flow:
 *   1. Build real-time player context (stats, missions, equipment)
 *   2. Fetch chat history (recent messages + rolling summary)
 *   3. Build pages if unassigned events ≥ 20
 *   4. Semantic search via RAG-Service → Pinecone (Top-5 relevant pages)
 *   5. Fetch last 20 raw events for short-term memory
 *   6. Send everything to RAG-Service /chat → Mistral LLM → reply
 *   7. Save user message + reply to ChatHistory
 *   8. Trigger history summarization if needed
 *
 * No fallback mode, no dual-path. One clean pipeline.
 * If RAG-Service is down, the assistant degrades gracefully
 * (uses only profile + recent events).
 */
import { userRepo } from '../repositories/userRepository.js';
import { trackerRepo } from '../repositories/trackerRepository.js';
import { ChatMessage, ChatSummary } from '../Models/chatHistory.js';
import * as ragService from './ragService.js';
import 'dotenv/config';

// Messages to summarize before TTL deletes them
const SUMMARIZE_THRESHOLD = 20; // trigger summarization when > 20 messages exist
const CHAT_HISTORY_LIMIT = 10;  // last 5 exchanges = 10 messages

// ── Build real-time player context ───────────────────

async function buildUserContext(userId) {
  const user = await userRepo.findByIdLean(userId);
  if (!user) return null;

  const trackers = await trackerRepo.findByUserId(userId);

  const stats = Object.entries(user.stats || {}).map(([stat, data]) =>
    `${stat}: Level ${data.level || 1}, XP ${data.value || 0}`
  ).join(' | ');

  const activeMissions = trackers.map(t =>
    `"${t.title}" — Day ${t.daycount}/${t.duration}, Streak ${t.streak}, ${t.remainingQuests?.length || 0} quests remaining`
  ).join('\n  ');

  const equipCount = user.equiments?.length || 0;
  const skillCount = user.skills?.length || 0;
  const completedCount = user.completed_trackers?.length || 0;

  const profile = `Username: ${user.username}
Level: ${user.level} | XP: ${user.xp} | Rank: ${user.rank} | Coins: ${user.coins}
Stats: ${stats}
Equipment owned: ${equipCount} | Skills unlocked: ${skillCount}
Missions completed: ${completedCount} | Active missions: ${trackers.length}
Titles: ${(user.titles || []).join(', ') || 'None'}`;

  return {
    profile,
    activeMissions: activeMissions || 'No active missions.',
  };
}

// ── Chat History Management ──────────────────────────

async function getChatHistory(userId) {
  // Get recent messages
  const messages = await ChatMessage.find({ userId })
    .sort({ timestamp: -1 })
    .limit(CHAT_HISTORY_LIMIT)
    .lean();

  messages.reverse(); // chronological order

  // Get rolling summary (long-term memory)
  const summaryDoc = await ChatSummary.findOne({ userId }).lean();

  return {
    messages: messages.map(m => ({ role: m.role, content: m.content })),
    summary: summaryDoc?.summary || '',
  };
}

async function saveChatMessages(userId, userMessage, assistantReply) {
  await ChatMessage.insertMany([
    { userId, role: 'user', content: userMessage },
    { userId, role: 'assistant', content: assistantReply },
  ]);
}

async function maybeSummarizeHistory(userId) {
  const totalMessages = await ChatMessage.countDocuments({ userId });

  if (totalMessages <= SUMMARIZE_THRESHOLD) return;

  // Get oldest messages that should be summarized
  // (keep the most recent CHAT_HISTORY_LIMIT, summarize the rest)
  const oldMessages = await ChatMessage.find({ userId })
    .sort({ timestamp: 1 })
    .limit(totalMessages - CHAT_HISTORY_LIMIT)
    .lean();

  if (oldMessages.length < 10) return; // not worth summarizing yet

  // Get existing summary
  const existing = await ChatSummary.findOne({ userId }).lean();
  const existingSummary = existing?.summary || '';

  // Ask RAG-Service to summarize
  const newSummary = await ragService.summarizeHistory(
    oldMessages.map(m => ({ role: m.role, content: m.content })),
    existingSummary,
  );

  // Upsert rolling summary
  await ChatSummary.findOneAndUpdate(
    { userId },
    {
      summary: newSummary,
      lastUpdatedAt: new Date(),
      $inc: { messagesCovered: oldMessages.length },
    },
    { upsert: true },
  );

  // Delete the old messages (they're now in the summary)
  const oldIds = oldMessages.map(m => m._id);
  await ChatMessage.deleteMany({ _id: { $in: oldIds } });

  console.log(`[Assistant] Summarized ${oldMessages.length} messages for user ${userId}`);
}

// ── Public API ───────────────────────────────────────

/**
 * Chat with the AI assistant.
 * Sends full context to RAG-Service for semantic retrieval + LLM response.
 */
export const chat = async (userId, message) => {
  // 1. Build real-time player context
  const userContext = await buildUserContext(userId);
  if (!userContext) {
    return { reply: "I couldn't find your player profile. Please make sure you're logged in.", source: 'error' };
  }

  // 2. Fetch chat history (recent messages + rolling summary)
  const { messages: chatHistory, summary: chatSummary } = await getChatHistory(userId);

  // 3. Trigger page build on RAG-Service (safety net — Redis consumer usually handles this)
  ragService.triggerPageBuild(userId).catch(err =>
    console.error('[Assistant] Page build trigger error:', err.message)
  );

  // 4. Semantic search via RAG-Service → Pinecone (Top-5)
  const semanticResults = await ragService.semanticSearch(userId, message, 5);

  // 5. Get last 20 raw events for short-term memory
  const recentEvents = await ragService.getRecentEvents(userId, 20);
  const recentEventSummaries = recentEvents.map(e => e.summary);

  // 6. Send everything to RAG-Service for LLM response
  const ragResponse = await ragService.chatWithRAG({
    userProfile: userContext.profile,
    activeMissions: userContext.activeMissions,
    chatHistory,
    chatSummary,
    recentEvents: recentEventSummaries,
    semanticContext: semanticResults,
    message,
  });

  let reply;
  let source;

  if (ragResponse && ragResponse.reply) {
    reply = ragResponse.reply;
    source = ragResponse.source || 'semantic';
  } else {
    // RAG-Service is down — minimal response with just profile context
    reply = `I'm having trouble accessing my full memory right now, but based on your current profile:\n\n` +
      `You're **${userContext.profile.split('\n')[0].replace('Username: ', '')}**, ` +
      `and you have ${recentEvents.length} recent activities logged. ` +
      `Try again in a moment for a more detailed analysis!`;
    source = 'degraded';
    console.warn('[Assistant] RAG-Service unavailable, serving degraded response');
  }

  // 7. Save chat messages to history
  await saveChatMessages(userId, message, reply).catch(err =>
    console.error('[Assistant] Failed to save chat history:', err.message)
  );

  // 8. Trigger summarization if needed (non-blocking)
  maybeSummarizeHistory(userId).catch(err =>
    console.error('[Assistant] Summarization error:', err.message)
  );

  return { reply, source };
};
