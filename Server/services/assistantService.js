/**
 * AssistantService — AI Growth Assistant with full player context.
 *
 * Unified flow:
 *   1. Build real-time player context (stats, missions, equipment)
 *   2. Fetch chat history (recent messages + rolling summary)
 *   3. Build pages if unassigned events ≥ 20
 *   4. Fetch last 20 raw events for short-term memory
 *   5. Send everything to RAG-Service /chat → semantic search + Mistral LLM → reply
 *   6. Handle Pending Mission proposals & cancelations
 *   7. Save user message + reply to ChatHistory
 *   8. Trigger history summarization if needed
 *
 * No fallback mode, no dual-path. One clean pipeline.
 * If RAG-Service is down, the assistant degrades gracefully
 * (uses only profile + recent events).
 */
import { userRepo } from '../repositories/userRepository.js';
import { trackerRepo } from '../repositories/trackerRepository.js';
import * as trackerService from '../services/trackerService.js';
import { ChatMessage, ChatSummary } from '../Models/chatHistory.js';
import { AssistantPendingAction } from '../Models/assistantPendingAction.js';
import { createMissionFromGenerated } from './missionService.js';
import * as ragService from './ragService.js';
import 'dotenv/config';

// Messages to summarize before TTL deletes them
const SUMMARIZE_THRESHOLD = 20; // trigger summarization when > 20 messages exist
const CHAT_HISTORY_LIMIT = 10;  // last 5 exchanges = 10 messages
const MISSION_PROPOSAL_TTL_HOURS = 2;

const parseRequestedDays = (message) => {
  const match = message.match(/\b([1-9]|[12]\d|30)\s*(day|days|d)\b/i);
  if (match) return Number(match[1]);
  return 7;
};

const renderMissionProposal = (generated, days) => {
  const quests = (generated.quests || [])
    .slice(0, 4)
    .map((q, idx) => `${idx + 1}. ${q.title} (${q.statAffected}, ${q.xp} XP)`)
    .join('\n');

  return [
    `I generated a mission plan for **${days} days**:`,
    '',
    `Title: ${generated.title}`,
    `Rank: ${generated.rank}`,
    `Reward: ${generated.reward?.xp || 0} XP, ${generated.reward?.coins || 0} coins`,
    '',
    'Quests:',
    quests || '- No quests generated',
    '',
    'Reply with **yes** to add this mission to your account, or tell me what to change.',
  ].join('\n');
};

const savePendingMissionProposal = async (userId, payload) => {
  const expiresAt = new Date(Date.now() + MISSION_PROPOSAL_TTL_HOURS * 60 * 60 * 1000);
  await AssistantPendingAction.findOneAndUpdate(
    { userId },
    {
      type: 'mission_proposal',
      payload,
      expiresAt,
      createdAt: new Date(),
    },
    { upsert: true, new: true }
  );
};

const clearPendingMissionProposal = async (userId) => {
  await AssistantPendingAction.deleteOne({ userId, type: 'mission_proposal' });
};

const getPendingMissionProposal = async (userId) => {
  const pending = await AssistantPendingAction.findOne({ userId, type: 'mission_proposal' }).lean();
  if (!pending) return null;
  if (pending.expiresAt && new Date(pending.expiresAt).getTime() < Date.now()) {
    await clearPendingMissionProposal(userId);
    return null;
  }
  return pending;
};


// ── Chat History Management ──────────────────────────

export async function clearChatHistory(userId) {
  await ChatMessage.deleteMany({ userId });
  await ChatSummary.deleteOne({ userId });
  return { cleared: true };
}

export async function getChatHistory(userId) {
  // Get recent messages (chronological fallback to _id to resolve identical timestamps)
  const messages = await ChatMessage.find({ userId })
    .sort({ timestamp: -1, _id: -1 })
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
  const now = Date.now();
  await ChatMessage.insertMany([
    { userId, role: 'user', content: userMessage, timestamp: new Date(now - 1) },
    { userId, role: 'assistant', content: assistantReply, timestamp: new Date(now) },
  ]);
}

async function maybeSummarizeHistory(userId) {
  const totalMessages = await ChatMessage.countDocuments({ userId });

  if (totalMessages <= SUMMARIZE_THRESHOLD) return;

  // Get oldest messages that should be summarized
  const oldMessages = await ChatMessage.find({ userId })
    .sort({ timestamp: 1, _id: 1 })
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
 * Sends full context to RAG-Service for LLM response.
 */
export const chat = async (userId, message) => {
  // 1. Verify user exists
  const user = await userRepo.findByIdLean(userId);
  if (!user) {
    return { reply: "I couldn't find your player profile. Please make sure you're logged in.", source: 'error' };
  }

  const pendingMission = await getPendingMissionProposal(userId);

  // 3. Trigger page build on RAG-Service (safety net — Redis consumer usually handles this)
  ragService.triggerPageBuild(userId).catch(err =>
    console.error('[Assistant] Page build trigger error:', err.message)
  );


// 5. Send to RAG-Service for Semantic Search + LLM response
  const ragResponse = await ragService.chatWithRAG({
    userId: userId.toString(),
    message,
    hasPendingMission: Boolean(pendingMission?.payload?.generatedMission),
  });

  let reply;
  let source;
  let action;

  if (ragResponse && ragResponse.reply) {
    reply = ragResponse.reply;
    source = ragResponse.source || 'semantic';
    action = ragResponse.action;
  } else {
    // RAG-Service is down — minimal response
    reply = `I'm having trouble accessing my full memory right now, but I remember you're **${user.username}**. ` +
      `Try again in a moment for a more detailed analysis!`;
    source = 'degraded';
    console.warn('[Assistant] RAG-Service unavailable, serving degraded response');
  }

  if (action) {
    if (action.type === 'cancel_mission') {
      if (pendingMission?.payload?.generatedMission) {
        await clearPendingMissionProposal(userId);
      }
      await saveChatMessages(userId, message, reply).catch(err =>
        console.error('[Assistant] Failed to save chat history:', err.message)
      );
      return { reply, source: 'action', action: { type: 'mission_proposal_canceled' } };
    }

    if (action.type === 'confirm_mission') {
      if (!pendingMission?.payload?.generatedMission) {
        const errorReply = "I couldn't find a pending mission draft to add. We may have timed out, or I lost track! Ask me to suggest a new mission for you.";
        await saveChatMessages(userId, message, errorReply).catch(err =>
          console.error('[Assistant] Failed to save chat history:', err.message)
        );
        return { reply: errorReply, source: 'error' };
      }

      const saved = await createMissionFromGenerated(
        pendingMission.payload.generatedMission,
        pendingMission.payload.days || 7
      );
      await clearPendingMissionProposal(userId);

      // Automatically enroll the user in the mission they just confirmed
      await trackerService.joinMission(userId, saved.mission._id);

      await saveChatMessages(userId, message, reply).catch(err =>
        console.error('[Assistant] Failed to save chat history:', err.message)
      );

      return {
        reply,
        source: 'action',
        action: {
          type: 'mission_created',
          missionId: saved.mission._id,
          title: saved.mission.title,
        },
      };
    }

    if (action.type === 'propose_mission') {
      const days = action.days || parseRequestedDays(message);
      const generated = action.mission;
      if (generated?.quests?.length) {
        await savePendingMissionProposal(userId, { generatedMission: generated, days });
        await saveChatMessages(userId, message, reply).catch(err =>
          console.error('[Assistant] Failed to save chat history:', err.message)
        );

        return {
          reply,
          source: 'action',
          action: {
            type: 'mission_proposed',
            requiresConfirmation: true,
            title: generated.title,
            rank: generated.rank,
            reward: generated.reward,
            quests: generated.quests.slice(0, 4), // Optional limit for preview
            days,
          },
        };
      }
    }
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
