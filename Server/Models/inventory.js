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
  effect: {
    stat: { type: String, enum: ['strength', 'agility', 'intelligence', 'endurance', 'charisma', 'coins', 'all'], default: null },
    bonus: { type: Number, default: 0 }, // e.g. 0.05 = +5%
    description: String, // human-readable description for UI
  },
  rarity: String,
});

export const Equiment=new mongoose.model('Equipment', EquipmentSchema);