/**
 * Backfill Embeddings — Migrate existing PageSummary docs to Pinecone.
 *
 * Finds all PageSummary docs that haven't been embedded yet (no pineconeId or no embeddedAt)
 * and sends them to the RAG-Service for embedding in Pinecone.
 *
 * Run once after deploying the new RAG-Service:
 *   node seeds/backfillEmbeddings.js
 *
 * Prerequisites:
 *   - RAG-Service running on port 8100
 *   - Pinecone index created (python scripts/create_index.py)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { PageSummary } from '../Models/eventLog.js';

const MONGO_URI = process.env.MONGO_URI;
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8100';

async function backfill() {
  console.log('🔄 Backfill Embeddings\n');

  // 1. Connect to MongoDB
  await mongoose.connect(MONGO_URI);
  console.log('  ✅ MongoDB connected\n');

  // 2. Check RAG-Service health
  try {
    const health = await fetch(`${RAG_SERVICE_URL}/health`);
    const data = await health.json();
    console.log(`  RAG-Service: ${data.status} | Pinecone: ${data.pinecone} | Mistral: ${data.mistral}`);
    if (!data.pinecone) {
      console.error('  ❌ Pinecone is not available. Run: cd RAG-Service && python scripts/create_index.py');
      process.exit(1);
    }
  } catch {
    console.error('  ❌ RAG-Service not reachable. Start it first: uvicorn server:app --port 8100');
    process.exit(1);
  }

  // 3. Find pages without embeddings
  const pages = await PageSummary.find({
    $or: [
      { embeddedAt: null },
      { embeddedAt: { $exists: false } },
      { pineconeId: '' },
      { pineconeId: { $exists: false } },
    ],
  }).sort({ userId: 1, pageIndex: 1 }).lean();

  if (pages.length === 0) {
    console.log('\n  ℹ️  All pages are already embedded. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  console.log(`\n  Found ${pages.length} unembedded pages. Starting...\n`);

  let success = 0;
  let failed = 0;

  for (const page of pages) {
    const userId = page.userId.toString();
    const pineconeId = `${userId}__page_${page.pageIndex}`;

    try {
      const res = await fetch(`${RAG_SERVICE_URL}/pages/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          pageIndex: page.pageIndex,
          summary: page.summary,
          keywords: page.keywords || [],
          timeFrom: page.timeRange?.from?.toISOString() || '',
          timeTo: page.timeRange?.to?.toISOString() || '',
          eventCount: page.eventCount || 0,
        }),
      });

      if (res.ok) {
        await PageSummary.updateOne(
          { _id: page._id },
          { $set: { embeddedAt: new Date(), pineconeId } },
        );
        success++;
        console.log(`  ✅ Page ${page.pageIndex} (user: ${userId.slice(-6)}) → ${pineconeId}`);
      } else {
        const err = await res.json().catch(() => ({}));
        console.error(`  ❌ Page ${page.pageIndex} (user: ${userId.slice(-6)}): HTTP ${res.status}`, err);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ Page ${page.pageIndex}: ${err.message}`);
      failed++;
    }

    // Rate limit: 200ms between requests
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ✅ Embedded: ${success}`);
  console.log(`  ❌ Failed:   ${failed}`);
  console.log(`  Total:      ${pages.length}`);

  await mongoose.disconnect();
}

backfill().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
