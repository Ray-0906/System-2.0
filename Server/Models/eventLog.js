/**
 * EventLog Model — stores every significant user action.
 * Core data for Semantic RAG (Pinecone + Mistral embeddings).
 *
 * Events are logged in real-time, then grouped into "pages" of 20 events.
 * Each page gets an LLM summary, which is embedded and stored in Pinecone
 * for semantic retrieval.
 */
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const eventLogSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:      { type: String, required: true },   // e.g. 'quest:completed', 'equipment:purchased'
  data:      { type: Schema.Types.Mixed },        // structured event payload
  summary:   { type: String, required: true },    // human-readable: "Completed 'Morning Run', gained 50 STR XP"
  timestamp: { type: Date, default: Date.now, index: true },
  pageIndex: { type: Number, default: -1 },       // -1 = unassigned to a page yet
}, { timestamps: false });

// Compound indexes for efficient RAG retrieval
eventLogSchema.index({ userId: 1, timestamp: -1 });
eventLogSchema.index({ userId: 1, pageIndex: 1 });

export const EventLog = model('EventLog', eventLogSchema);

/**
 * PageSummary — one per page of 20 events.
 * Each page stores a Mistral-generated summary and tracks its Pinecone vector.
 * The actual embedding vector lives in Pinecone (not MongoDB).
 */
const pageSummarySchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  pageIndex:  { type: Number, required: true },
  eventCount: { type: Number, default: 0 },
  timeRange: {
    from: { type: Date },
    to:   { type: Date },
  },
  summary:    { type: String, default: '' },       // LLM-generated summary of the page
  keywords:   [{ type: String }],                  // extracted keywords (kept for debugging)
  pineconeId: { type: String, default: '' },       // "{userId}__page_{pageIndex}" — vector ID in Pinecone
  embeddedAt: { type: Date },                      // when the vector was stored in Pinecone
}, { timestamps: true });

pageSummarySchema.index({ userId: 1, pageIndex: 1 }, { unique: true });

export const PageSummary = model('PageSummary', pageSummarySchema);
