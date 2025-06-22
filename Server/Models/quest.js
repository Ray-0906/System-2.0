import mongoose from "mongoose";

const questSchema = new mongoose.Schema({
  title: String,
  statAffected: { type: String, enum: ['strength', 'intelligence', 'agility', 'endurance', 'charisma'] },
  xp: Number
});
 export const Quest = mongoose.model('Quest', questSchema);