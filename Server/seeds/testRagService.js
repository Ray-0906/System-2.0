/**
 * Test RAG Service — Semantic RAG integration test.
 *
 * Tests the full pipeline:
 *   1. RAG-Service health check (Pinecone + Mistral)
 *   2. Database state (user, events, pages)
 *   3. Semantic search quality
 *   4. Chat with context
 *   5. Chat history continuity
 *
 * Run: node seeds/testRagService.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { chat } from '../services/assistantService.js';
import { EventLog, PageSummary } from '../Models/eventLog.js';
import { ChatMessage, ChatSummary } from '../Models/chatHistory.js';
import { User } from '../Models/user.js';

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8100';

async function test() {
  console.log('📊 Semantic RAG System Test\n');

  // 1. Connect
  await mongoose.connect(process.env.MONGO_URI);
  console.log('1. Database connected\n');

  // 2. RAG-Service health
  console.log('2. Checking RAG-Service health...');
  try {
    const res = await fetch(`${RAG_SERVICE_URL}/health`);
    const data = await res.json();
    console.log(`   Status: ${data.status}`);
    console.log(`   Pinecone: ${data.pinecone ? '✅ connected' : '❌ unavailable'}`);
    console.log(`   Mistral:  ${data.mistral ? '✅ connected' : '❌ unavailable'}\n`);
  } catch {
    console.log('   ❌ RAG-Service not reachable at', RAG_SERVICE_URL, '\n');
  }

  // 3. Database state
  console.log('3. Checking database...');
  const user = await User.findOne().lean();
  if (!user) {
    console.log('   ❌ No users found. Run seed scripts first.\n');
    await mongoose.disconnect();
    return;
  }

  const eventCount = await EventLog.countDocuments({ userId: user._id });
  const pageCount = await PageSummary.countDocuments({ userId: user._id });
  const embeddedCount = await PageSummary.countDocuments({
    userId: user._id,
    embeddedAt: { $exists: true, $ne: null },
  });
  const chatCount = await ChatMessage.countDocuments({ userId: user._id });

  console.log(`   User: ${user.username} (${user._id})`);
  console.log(`   Events: ${eventCount}`);
  console.log(`   Pages: ${pageCount} (${embeddedCount} embedded in Pinecone)`);
  console.log(`   Chat messages: ${chatCount}\n`);

  // 4. Test questions
  const questions = [
    { q: "What's my current progress? Give me an overview.", expects: 'profile data' },
    { q: "Which stat am I weakest in? What should I focus on?", expects: 'stat analysis' },
    { q: "Why am I failing?", expects: 'semantic match on penalties/streak breaks' },
    { q: "What patterns do you see in my behavior?", expects: 'historical analysis from RAG' },
    { q: "Tell me more about that", expects: 'chat history continuity' },
  ];

  console.log('4. Testing assistant (semantic RAG)...\n');

  for (const { q, expects } of questions) {
    console.log('━'.repeat(50));
    console.log(`🗣️  "${q}"`);
    console.log(`   (expects: ${expects})\n`);

    try {
      const start = Date.now();
      const result = await chat(user._id, q);
      const elapsed = Date.now() - start;

      console.log(`🤖 [${result.source}] (${elapsed}ms):`);
      console.log(result.reply.substring(0, 300));
      if (result.reply.length > 300) console.log('...(truncated)');
      console.log();
    } catch (err) {
      console.log(`❌ Error: ${err.message}\n`);
    }
  }

  // 5. Check chat history was saved
  console.log('━'.repeat(50));
  console.log('5. Chat history check...');
  const savedMessages = await ChatMessage.countDocuments({ userId: user._id });
  const savedSummary = await ChatSummary.findOne({ userId: user._id }).lean();
  console.log(`   Messages saved: ${savedMessages}`);
  console.log(`   Rolling summary: ${savedSummary ? savedSummary.summary.substring(0, 100) + '...' : 'None yet'}\n`);

  console.log('✅ Test complete');
  await mongoose.disconnect();
}

test().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
