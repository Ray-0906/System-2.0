import mongoose from 'mongoose';

const assistantPendingActionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  type: { type: String, required: true },
  payload: { type: mongoose.Schema.Types.Mixed, required: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Auto-delete expired pending actions.
assistantPendingActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AssistantPendingAction = mongoose.model('AssistantPendingAction', assistantPendingActionSchema);
