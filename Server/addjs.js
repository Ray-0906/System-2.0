import mongoose from "mongoose";
import { Skill } from "./Models/skill.js";
// Adjust the import path accordingly

export async function addSkills() {
  try {
    const skills = [
     
      {
        name: "Shadow Skip",
        description: "Boosts agility and allows dodging attacks.",
        rank: "E",
        icon: "https://example.com/icons/shadow_step.png",
        statRequired: [{ stat: "agility", value: 1 }],
        minLevel: 1
      },
      
      {
        name: "Charismatic Newbie",
        description: "Increases charisma and party leadership skills.",
        rank: "E",
        icon: "https://example.com/icons/charismatic_leader.png",
        statRequired: [{ stat: "charisma", value: 1}],
        minLevel: 1
      },
      
    ];

    await Skill.insertMany(skills);
    console.log('Skills added successfully');
  } catch (error) {
    console.error('Error adding skills:', error);
  }
}

// Call the function

