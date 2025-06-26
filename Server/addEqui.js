import mongoose from "mongoose";
import { Equiment } from "./Models/inventory.js";
// Adjust the path as needed

 export async function addEquipments() {
  try {
    const equipments = [
      {
        name: "Shadow Blade",
        type: "weapon",
        description: "A blade forged from shadows. Increases strength and agility.",
        icon: "https://example.com/icons/shadow_blade.png",
        cost: 150,
        statBonuses: { strength: 8, endurance: 0, intelligence: 0, agility: 5 },
        effect: "+5% XP on dungeon quests",
        rarity: "epic"
      },
      {
        name: "Hunter's Cloak",
        type: "armor",
        description: "A cloak that enhances endurance and agility.",
        icon: "https://example.com/icons/hunters_cloak.png",
        cost: 100,
        statBonuses: { strength: 0, endurance: 7, intelligence: 0, agility: 3 },
        effect: "+2% XP on all quests",
        rarity: "rare"
      },
      {
        name: "Wise Sage Amulet",
        type: "accessory",
        description: "An amulet that boosts intelligence.",
        icon: "https://example.com/icons/sage_amulet.png",
        cost: 120,
        statBonuses: { strength: 0, endurance: 0, intelligence: 10, agility: 0 },
        effect: "+10% XP on intelligence quests",
        rarity: "epic"
      },
      {
        name: "Steel Gauntlets",
        type: "armor",
        description: "Heavy gauntlets that provide extra strength and endurance.",
        icon: "https://example.com/icons/steel_gauntlets.png",
        cost: 80,
        statBonuses: { strength: 5, endurance: 5, intelligence: 0, agility: 0 },
        effect: "+3% XP on strength quests",
        rarity: "uncommon"
      },
      {
        name: "Swift Boots",
        type: "accessory",
        description: "Boots that greatly increase agility.",
        icon: "https://example.com/icons/swift_boots.png",
        cost: 90,
        statBonuses: { strength: 0, endurance: 0, intelligence: 0, agility: 8 },
        effect: "+7% XP on agility quests",
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

