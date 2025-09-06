import mongoose from "mongoose";

const sidequestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deadline: { type: Date, default: null },
  status: { type: String, enum: ['pending','completed'], default: 'pending' },
  evaluated: {
    difficulty: { type: String, enum: ['trivial','easy','medium','hard'], required: true },
    xp: { type: Number, required: true },
    coins: { type: Number, required: true },
    stat: { type: String, enum: ['strength','intelligence','agility','endurance','charisma'], required: true }
  },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { minimize: false });
export const Sidequest= mongoose.model('Sidequest', sidequestSchema);