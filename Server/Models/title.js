import mongoose from "mongoose";

const titleSchema = new mongoose.Schema({
  name: String,
  unlockCondition: String
});
export const Title = mongoose.model('Title', titleSchema);