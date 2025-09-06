import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema({
  type: { type: String, enum: ['level','statTotal','missionsCompleted','streak','coins','statLevel','rank'], required: true },
  stat: { type: String }, // for statTotal/statLevel
  value: { type: Number, required: true }
},{ _id:false });

const titleSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  tier: { type: Number, default: 1 }, // higher = rarer
  group: { type: String, default: 'General' },
  flavor: { type: String },
  requirements: [requirementSchema],
  icon: { type: String },
  hidden: { type: Boolean, default: false }
});
export const Title = mongoose.model('Title', titleSchema);