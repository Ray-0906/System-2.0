import mongoose from 'mongoose';

const UserStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, required: true },
  multipliers: {
    strength:     { type: Number, default: 1.0 },
    intelligence: { type: Number, default: 1.0 },
    agility:      { type: Number, default: 1.0 },
    endurance:    { type: Number, default: 1.0 },
    charisma:     { type: Number, default: 1.0 },
    coins:        { type: Number, default: 1.0 },
  },
  temporary: {
    coinPenaltyActive: { type: Boolean, default: false },
  },
  updatedAt: { type: Date, default: Date.now },
});

export const UserState = mongoose.model('UserState', UserStateSchema);
