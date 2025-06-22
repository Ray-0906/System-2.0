import mongoose from 'mongoose';
const missionSchema = new mongoose.Schema({
  title: String,
  description: String,
   duration:Number,
  quests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
 reward: {
  xp: Number,
  coins: Number,
  specialReward: {
    type: String,
    enum: ['common', 'rare', 'epic'],
    default: null
  }
},
  penalty: {
    missionFail: { coins: Number, stats: Number },
    skip: { coins: Number, stats: Number }
  },
  rank: { type: String, enum: ['E', 'D', 'C', 'B', 'A', 'S'], default: 'E' },
  public: { type: Boolean, default: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});
export const Mission = mongoose.model('Mission', missionSchema);