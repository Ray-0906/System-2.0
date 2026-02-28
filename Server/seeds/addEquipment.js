import mongoose from "mongoose";
import { Equiment } from "../Models/inventory.js";
// Adjust the path as needed

 export async function addEquipments() {
  try {
    const equipments = [
  {
    name: "Night Fang Blade",
    type: "weapon",
    description: "Forged in the shadows, this blade thrives in darkness.",
    icon: "night-fang.png",
    cost: 800,
    statBonuses: { strength: 8, agility: 5, intelligence: 0, endurance: 0 },
    effect: { stat: 'strength', bonus: 0.05, description: "+5% Strength XP" },
    rarity: "epic"
  },
  {
    name: "Arcane Staff",
    type: "weapon",
    description: "A staff infused with ancient mana flows.",
    icon: "arcane-staff.png",
    cost: 950,
    statBonuses: { strength: 0, agility: 0, intelligence: 12, endurance: 3 },
    effect: { stat: 'intelligence', bonus: 0.08, description: "+8% Intelligence XP" },
    rarity: "epic"
  },
  {
    name: "Steel Fang Dagger",
    type: "weapon",
    description: "Fast, silent, and deadly.",
    icon: "steel-fang.png",
    cost: 600,
    statBonuses: { strength: 5, agility: 7, intelligence: 0, endurance: 0 },
    effect: { stat: 'agility', bonus: 0.05, description: "+5% Agility XP" },
    rarity: "rare"
  },
  {
    name: "Brutal Warhammer",
    type: "weapon",
    description: "A heavy weapon that crushes foes with brutal force.",
    icon: "warhammer.png",
    cost: 1100,
    statBonuses: { strength: 12, endurance: 6, intelligence: 0, agility: -2 },
    effect: { stat: 'strength', bonus: 0.10, description: "+10% Strength XP" },
    rarity: "epic"
  },
  {
    name: "Windslicer Katana",
    type: "weapon",
    description: "A katana that cuts with the force of wind.",
    icon: "windslicer-katana.png",
    cost: 750,
    statBonuses: { strength: 6, agility: 8, intelligence: 0, endurance: 1 },
    effect: { stat: 'agility', bonus: 0.03, description: "+3% Agility XP" },
    rarity: "rare"
  },
  {
    name: "Shadow Cloak",
    type: "armor",
    description: "A cloak woven from void threads, deflects attention.",
    icon: "shadow-cloak.png",
    cost: 700,
    statBonuses: { strength: 0, agility: 5, intelligence: 3, endurance: 5 },
    effect: { stat: 'agility', bonus: 0.05, description: "+5% Agility XP" },
    rarity: "epic"
  },
  {
    name: "Titan Plate Mail",
    type: "armor",
    description: "Heavy armor forged for kings and conquerors.",
    icon: "titan-mail.png",
    cost: 1000,
    statBonuses: { strength: 6, agility: -2, intelligence: 0, endurance: 12 },
    effect: { stat: 'endurance', bonus: 0.10, description: "+10% Endurance XP" },
    rarity: "epic"
  },
  {
    name: "Leather Tunic",
    type: "armor",
    description: "Basic protection with flexibility.",
    icon: "leather-tunic.png",
    cost: 300,
    statBonuses: { strength: 1, agility: 3, intelligence: 0, endurance: 2 },
    effect: { stat: null, bonus: 0, description: "None" },
    rarity: "common"
  },
  {
    name: "Enchanted Robe",
    type: "armor",
    description: "A magical robe enhancing mana regeneration.",
    icon: "enchanted-robe.png",
    cost: 650,
    statBonuses: { strength: 0, agility: 0, intelligence: 8, endurance: 2 },
    effect: { stat: 'intelligence', bonus: 0.10, description: "+10% Intelligence XP" },
    rarity: "rare"
  },
  {
    name: "Scale Armor of the Forgotten",
    type: "armor",
    description: "Mysterious armor that pulses with old power.",
    icon: "forgotten-scale.png",
    cost: 850,
    statBonuses: { strength: 3, agility: 2, intelligence: 5, endurance: 7 },
    effect: { stat: 'all', bonus: 0.05, description: "+5% All Stats XP" },
    rarity: "epic"
  },
  {
    name: "Ring of Insight",
    type: "accessory",
    description: "Enhances intelligence and grants arcane clarity.",
    icon: "ring-of-insight.png",
    cost: 400,
    statBonuses: { strength: 0, agility: 0, intelligence: 6, endurance: 1 },
    effect: { stat: 'all', bonus: 0.05, description: "+5% All Stats XP" },
    rarity: "rare"
  },
  {
    name: "Pendant of Endurance",
    type: "accessory",
    description: "Increases stamina and resistance.",
    icon: "pendant-endurance.png",
    cost: 350,
    statBonuses: { strength: 0, agility: 0, intelligence: 0, endurance: 7 },
    effect: { stat: 'endurance', bonus: 0.07, description: "+7% Endurance XP" },
    rarity: "rare"
  },
  {
    name: "Charm of the Phantom",
    type: "accessory",
    description: "A charm infused with stealth magic.",
    icon: "phantom-charm.png",
    cost: 550,
    statBonuses: { strength: 0, agility: 6, intelligence: 2, endurance: 0 },
    effect: { stat: 'agility', bonus: 0.10, description: "+10% Agility XP" },
    rarity: "epic"
  },
  {
    name: "Token of the Monarch",
    type: "accessory",
    description: "Symbol of authority and immense power.",
    icon: "monarch-token.png",
    cost: 1200,
    statBonuses: { strength: 5, agility: 5, intelligence: 5, endurance: 5 },
    effect: { stat: 'all', bonus: 0.10, description: "+10% All Stats XP" },
    rarity: "legendary"
  },
  {
    name: "Amulet of Swiftness",
    type: "accessory",
    description: "Boosts agility during combat.",
    icon: "swiftness-amulet.png",
    cost: 400,
    statBonuses: { strength: 0, agility: 7, intelligence: 0, endurance: 1 },
    effect: { stat: 'coins', bonus: 0.05, description: "+5% Coin earnings" },
    rarity: "rare"
  }
];


    await Equiment.insertMany(equipments);
    console.log('Equipments added successfully');
  } catch (error) {
    console.error('Error adding equipments:', error);
  }
}

// Call the function
