/**
 * RAG Service — HTTP client to the Python RAG-Service.
 *
 * Handles:
 *   1. Semantic search: Query → RAG-Service → Top-5 relevant page summaries
 *   2. Chat: Send all context to RAG-Service for LLM response
 *   3. History summarization: Condense old chat messages
 *   4. Page build trigger: HTTP safety net if Redis missed events
 *
 * Page building (summarize + embed + Pinecone) now lives entirely
 * in the Python RAG-Service. This module is a thin HTTP client.
 *
 * NO Langchain, NO Mistral — all AI work is in Python.
 */
import { EventLog } from '../Models/eventLog.js';
import 'dotenv/config';

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8100';
const REQUEST_TIMEOUT = 60_000; // 60s — embedding + LLM can be slow
const INTERNAL_HEADERS = process.env.RAG_SERVICE_SECRET
  ? { 'x-rag-secret': process.env.RAG_SERVICE_SECRET }
  : {};

// ── RAG-Service Health Check ─────────────────────────
let _ragAvailable = null;
let _ragCheckedAt = 0;
const RAG_CHECK_INTERVAL = 60_000;

async function isRAGServiceAvailable() {
  if (Date.now() - _ragCheckedAt < RAG_CHECK_INTERVAL && _ragAvailable !== null) {
    return _ragAvailable;
  }
  try {
    const res = await fetch(`${RAG_SERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();
    _ragAvailable = data.status === 'ok' && data.pinecone && data.mistral;
  } catch {
    _ragAvailable = false;
  }
  _ragCheckedAt = Date.now();
  return _ragAvailable;
}

// ═══════════════════════════════════════════════════════
// PAGE BUILD TRIGGER (HTTP safety net)
// ═══════════════════════════════════════════════════════

/**
 * Trigger page building on the Python RAG-Service.
 * This is a safety net — normally the Redis consumer handles it.
 * Fire-and-forget: doesn't await the result.
 */
export const triggerPageBuild = async (userId) => {
  try {
    const res = await fetch(`${RAG_SERVICE_URL}/pages/build/${userId.toString()}`, {
      method: 'POST',
      headers: INTERNAL_HEADERS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.pagesBuilt > 0) {
        console.log(`[RAG] Triggered page build: ${data.pagesBuilt} pages for user ${userId}`);
      }
    }
  } catch (err) {
    // Non-critical — Redis consumer handles this normally
    console.error('[RAG] Page build trigger failed:', err.message);
  }
};

// ═══════════════════════════════════════════════════════
// SEMANTIC SEARCH
// ═══════════════════════════════════════════════════════

/**
 * Semantic search for relevant page summaries via RAG-Service → Pinecone.
 * Returns Top-K results sorted by similarity score.
 */
export const semanticSearch = async (userId, query, topK = 5) => {
  try {
    const res = await fetch(`${RAG_SERVICE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...INTERNAL_HEADERS },
      body: JSON.stringify({
        userId: userId.toString(),
        query,
        topK,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!res.ok) {
      console.error(`[RAG] Search failed (HTTP ${res.status})`);
      return [];
    }

    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('[RAG] Semantic search error:', err.message);
    return []; // Graceful degradation
  }
};

// ═══════════════════════════════════════════════════════
// CHAT (via RAG-Service)
// ═══════════════════════════════════════════════════════

/**
 * Send full context to RAG-Service for LLM chat response.
 * The RAG-Service handles prompt assembly and Mistral call.
 */
export const chatWithRAG = async (payload) => {
  try {
    const res = await fetch(`${RAG_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...INTERNAL_HEADERS },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error(`[RAG] Chat failed (HTTP ${res.status}):`, errData);
      return null;
    }

    return await res.json();
  } catch (err) {
    console.error('[RAG] Chat request error:', err.message);
    return null;
  }
};

// ═══════════════════════════════════════════════════════
// HISTORY SUMMARIZATION
// ═══════════════════════════════════════════════════════

/**
 * Ask RAG-Service to summarize old chat messages.
 */
export const summarizeHistory = async (messages, existingSummary = '') => {
  try {
    const res = await fetch(`${RAG_SERVICE_URL}/history/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...INTERNAL_HEADERS },
      body: JSON.stringify({ messages, existingSummary }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });

    if (!res.ok) return existingSummary;
    const data = await res.json();
    return data.summary || existingSummary;
  } catch (err) {
    console.error('[RAG] History summarize error:', err.message);
    return existingSummary;
  }
};

// ═══════════════════════════════════════════════════════
// DATA ACCESS
// ═══════════════════════════════════════════════════════

export const getRecentEvents = async (userId, limit = 20) => {
  return EventLog.find({ userId }).sort({ timestamp: -1 }).limit(limit).lean();
};

export const getPageEvents = async (userId, pageIndices) => {
  return EventLog.find({ userId, pageIndex: { $in: pageIndices } })
    .sort({ timestamp: 1 })
    .lean();
};

export { isRAGServiceAvailable };
