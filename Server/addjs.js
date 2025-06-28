import mongoose from "mongoose";
import { Skill } from "./Models/skill.js";
// Adjust the import path accordingly

export async function addSkills() {
  try {
    const skills = [
      { 
        name: "Phantom Army",
        description: "Summon shadow clones to fight alongside you briefly.",
        rank: "A",
        icon: "phantom-army.png",
        statRequired: [
          { stat: "intelligence", value: 40 },
          { stat: "charisma", value: 35 },
        ],
        minLevel: 22,
      },
      {
        name: "Mana Storm",
        description:
          "Unleashes a chaotic storm of mana, damaging all nearby enemies.",
        rank: "A",
        icon: "mana-storm.png",
        statRequired: [{ stat: "intelligence", value: 45 }],
        minLevel: 25,
      },
      {
        name: "King’s Command",
        description: "Force enemies to submit, reducing their ability to act.",
        rank: "A",
        icon: "kings-command.png",
        statRequired: [
          { stat: "charisma", value: 45 },
          { stat: "endurance", value: 30 },
        ],
        minLevel: 27,
      },
      {
        name: "Shadow Domain",
        description:
          "Create a dark zone that empowers you and weakens enemies.",
        rank: "S",
        icon: "shadow-domain.png",
        statRequired: [
          { stat: "intelligence", value: 55 },
          { stat: "charisma", value: 50 },
        ],
        minLevel: 35,
      },
      {
        name: "Annihilation Fist",
        description:
          "A single strike that obliterates anything in front of you.",
        rank: "S",
        icon: "annihilation-fist.png",
        statRequired: [
          { stat: "strength", value: 60 },
          { stat: "endurance", value: 50 },
        ],
        minLevel: 40,
      },
      {
        name: "Voidwalk",
        description:
          "Become untouchable for a few seconds, slipping between dimensions.",
        rank: "S",
        icon: "voidwalk.png",
        statRequired: [
          { stat: "agility", value: 60 },
          { stat: "intelligence", value: 50 },
        ],
        minLevel: 45,
      },
      {
        name: "Void Slash",
        description:
          "A swift slash that rends the air and damages all in its path.",
        rank: "C",
        icon: "void-slash.png",
        statRequired: [{ stat: "strength", value: 20 }],
        minLevel: 10,
      },
      {
        name: "Arcane Shield",
        description: "Summons a temporary barrier that blocks incoming spells.",
        rank: "C",
        icon: "arcane-shield.png",
        statRequired: [{ stat: "intelligence", value: 22 }],
        minLevel: 12,
      },
      {
        name: "Intimidating Presence",
        description: "Lowers enemy morale, reducing their damage temporarily.",
        rank: "C",
        icon: "intimidation.png",
        statRequired: [{ stat: "charisma", value: 25 }],
        minLevel: 13,
      },
      {
        name: "Flash Step",
        description: "Instantly teleport a short distance to evade an attack.",
        rank: "B",
        icon: "flash-step.png",
        statRequired: [
          { stat: "agility", value: 30 },
          { stat: "intelligence", value: 20 },
        ],
        minLevel: 15,
      },
      {
        name: "Overdrive",
        description:
          "Temporarily increases strength and agility beyond limits.",
        rank: "B",
        icon: "overdrive.png",
        statRequired: [
          { stat: "strength", value: 32 },
          { stat: "agility", value: 30 },
        ],
        minLevel: 17,
      },
      {
        name: "Shadow Dash",
        description:
          "Dash forward at blinding speed, leaving a shadow trail behind.",
        rank: "E",
        icon: "shadow-dash.png",
        statRequired: [{ stat: "agility", value: 10 }],
        minLevel: 2,
      },
      {
        name: "Mana Bolt",
        description: "Fire a bolt of condensed mana that pierces weak armor.",
        rank: "E",
        icon: "mana-bolt.png",
        statRequired: [{ stat: "intelligence", value: 12 }],
        minLevel: 3,
      },
      {
        name: "Vital Guard",
        description:
          "Increases endurance momentarily to reduce incoming damage.",
        rank: "D",
        icon: "vital-guard.png",
        statRequired: [{ stat: "endurance", value: 15 }],
        minLevel: 5,
      },
      {
        name: "Hunter's Instinct",
        description: "Enhances perception and reflexes for a short duration.",
        rank: "D",
        icon: "hunters-instinct.png",
        statRequired: [{ stat: "agility", value: 18 }],
        minLevel: 6,
      },
    ];

    await Skill.insertMany(skills);
    console.log("Skills added successfully");
  } catch (error) {
    console.error("Error adding skills:", error);
  }
}

// Call the function
