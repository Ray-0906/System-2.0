import mongoose from "mongoose";

const sidequestSchema = new mongoose.Schema({
  title: String,
  description: String,
  quests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: Date,
  reward: { coins: Number }
});
export const Sidequest= mongoose.model('Sidequest', sidequestSchema);