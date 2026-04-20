/**
 * ChatHistory — Conversational memory for the AI assistant.
 *
 * Two collections:
 *   1. ChatMessage — Individual messages with 30-day TTL auto-cleanup
 *   2. ChatSummary — Rolling condensed summary that persists forever
 *
 * Flow:
 *   - Every chat exchange is saved as ChatMessage docs
 *   - Before TTL deletes old messages, a summary is generated
 *   - The summary is merged into ChatSummary (one per user)
 *   - The assistant always has access to: recent messages + long-term summary
 */
import mongoose from 'mongoose';
const { Schema, model } = mongoose;

// ── Individual Messages (30-day TTL) ─────────────────

const chatMessageSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  role:      { type: String, enum: ['user', 'assistant'], required: true },
  content:   { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Fast retrieval of recent messages per user
chatMessageSchema.index({ userId: 1, timestamp: -1 });

// Auto-delete messages older than 30 days
chatMessageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

export const ChatMessage = model('ChatMessage', chatMessageSchema);


// ── Rolling Summary (persists forever) ───────────────

const chatSummarySchema = new Schema({
  userId:          { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  summary:         { type: String, default: '' },
  lastUpdatedAt:   { type: Date, default: Date.now },
  messagesCovered: { type: Number, default: 0 },  // total messages summarized
}, { timestamps: true });

export const ChatSummary = model('ChatSummary', chatSummarySchema);
