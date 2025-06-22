import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  rank: { type: String, enum: ['E', 'D', 'C', 'B', 'A', 'S'], default: 'E' },
  stats: {
    strength: {
      value: { type: Number, default: 0 },
      level: { type: Number, default: 1 }
    },
    intelligence: {
      value: { type: Number, default: 0 },
      level: { type: Number, default: 1 }
    },
    agility: {
      value: { type: Number, default: 0 },
      level: { type: Number, default: 1 }
    },
    endurance: {
      value: { type: Number, default: 0 },
      level: { type: Number, default: 1 }
    },
    charisma: {
      value: { type: Number, default: 0 },
      level: { type: Number, default: 1 }
    }
  },
  coins: { type: Number, default: 0 },
  titles: [String],
  achievements: [String],
  current_missions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mission' }],
  trackers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tracker' }],
  sidequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Sidequest' }]
});
export const User = mongoose.model('User', userSchema);