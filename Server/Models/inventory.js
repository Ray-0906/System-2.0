import mongoose from "mongoose";

const EquipmentSchema = new mongoose.Schema({
  name: String,
  type: String, // 'weapon', 'armor', 'accessory'
  description: String,
  icon: String, // URL to the equipment image
  cost: Number, // shop price in coins
  statBonuses: {
    strength: Number,
    endurance: Number,
    intelligence: Number,
    agility: Number,
    
  },
  effect: String, // e.g., "+5% XP on quests"
  rarity: String,
});

export const Equiment=new mongoose.model('Equipment', EquipmentSchema);