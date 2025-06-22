import mongoose from 'mongoose';
 
const trackerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  missionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Mission' },
  currentQuests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
  remainingQuests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
  questCompletion: {
    type: Map,
    of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
  },
  streak: { type: Number, default: 0 },
  daycount: { type: Number, default: 0 },
  lastUpdated: Date,
  lastCompleted: Date,
  penaltiesApplied: [Date],
  rewardsClaimed: { type: Boolean, default: false },
  failed:{ type: Boolean, default: false },
  // Flattened mission details
  title: String,
  description: String,
  duration: Number, // Duration in days
  reward: {
    xp: Number,
    coins: Number,
    specialReward: {
      type: String,
      enum: ['common', 'rare', 'epic'],
      default: null,
    },
  },
  penalty: {
    missionFail: { coins: Number, stats: Number },
    skip: { coins: Number, stats: Number },
  },
  rank: {
    type: String,
    enum: ['E', 'D', 'C', 'B', 'A', 'S'],
  },
});

export const Tracker = mongoose.model('Tracker', trackerSchema);
