import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import { ChatMistralAI } from '@langchain/mistralai';
import 'dotenv/config';

// 📌 Mission Schema
const MissionSchema = z.object({
  title: z.string(),
  refinedDescription: z.string(),
  quests: z.array(
    z.object({
      title: z.string(),
      statAffected: z.enum(['strength', 'intelligence', 'agility', 'endurance', 'charisma']),
      xp: z.number().int().nonnegative().min(1).max(50),
    })
  ).min(1).max(4),
  reward: z.object({
    xp: z.number().int().nonnegative().min(50).max(500),
    coins: z.number().int().nonnegative().min(10).max(100),
    specialReward: z.enum(['common', 'rare', 'epic']).nullable(),
  }),
  penalty: z.object({
    missionFail: z.object({
      coins: z.number().int().nonnegative().min(10).max(50),
      stats: z.number().int().nonnegative().min(1).max(5),
    }),
    skip: z.object({
      coins: z.number().int().nonnegative().min(5).max(20),
      stats: z.number().int().nonnegative().min(0).max(2),
    }),
  }),
  rank: z.enum(['E', 'D', 'C', 'B', 'A', 'S']),
});

const escapeCurlyBraces = (str) => str.replace(/{/g, '{{').replace(/}/g, '}}');

const customPrompt = PromptTemplate.fromTemplate(`
You are a mission generator for a life gamification app like Solo Leveling. Your task is to generate a structured JSON response based on the provided quests and number of days. The quest titles MUST NOT be changed and no extra quests should be added.

Inputs:
- Quests: {quests}
- Number of days: {days}

Instructions:
1. Generate a mission title (5-10 words) that summarizes the provided quests.
2. Refine the quests into a polished, concise mission description (50-100 words) based on the given quests.
3. Use the provided quests as-is (do not modify titles or add new quests). Each quest has:
   - title: The exact title provided
   - statAffected: One of: strength, intelligence, agility, endurance, charisma
   - xp: A positive integer (1-50 based on quest difficulty)
4. Set a rank from: E, D, C, B, A, S (S is hardest), based on mission difficulty and number of days.
5. Set mission rewards scaled with difficulty:
   - xp: A positive integer (50-500 based on rank, sum of quest XP or higher)
   - coins: A positive integer (10-100 based on rank)
   - specialReward: "common", "rare", or "epic" for ranks B, A, S; null for E, D, C
6. Generate penalties based on mission rank:
   - missionFail: An object with fields coins and stats (higher for harder ranks, 10-50 coins, 1-5 stats)
   - skip: An object with fields coins and stats (lighter than missionFail, 5-20 coins, 0-2 stats)
7. Ensure ALL fields in the schema are included, even if null or empty where allowed.
8. Output MUST be valid JSON wrapped in a markdown code block (\`\`\`json\n<your_json>\n\`\`\`).
9. Do NOT include any additional text, explanations, or comments outside the code block.

The JSON MUST strictly follow this schema:
{json_schema}

Example output for reference:
\`\`\`json
{{
  "title": "Fitness Challenge",
  "refinedDescription": "Complete a week-long fitness challenge to enhance strength and endurance.",
  "quests": [
    {{ "title": "Run 5km daily", "statAffected": "endurance", "xp": 50 }},
    {{ "title": "Complete 20 push-ups", "statAffected": "strength", "xp": 30 }}
  ],
  "reward": {{ "xp": 100, "coins": 20, "specialReward": null }},
  "penalty": {{
    "missionFail": {{ "coins": 10, "stats": 2 }},
    "skip": {{ "coins": 5, "stats": 1 }}
  }},
  "rank": "D"
}}
\`\`\`
`);

const model = new ChatMistralAI({
  model: 'mistral-large-latest',
  temperature: 0.6,
  maxTokens: 1500,
  apiKey: process.env.MISTRAL_API_KEY ,
});

const chain = RunnableSequence.from([
  {
    quests: (input) => JSON.stringify(input.quests),
    days: (input) => input.days,
    json_schema: () => escapeCurlyBraces(JSON.stringify(MissionSchema.shape, null, 2)),
  },
  customPrompt,
  model,
  {
    parse: (output) => {
      const content = output.content || output;
      const match = content.match(/```json\n([\s\S]+?)\n```/);
      const jsonStr = match ? match[1].trim() : content.trim();

      try {
        const parsed = JSON.parse(jsonStr);
        return MissionSchema.parse(parsed);
      } catch (e) {
        console.error('Raw output causing error:', jsonStr);
        throw new Error(`Failed to parse or validate JSON: ${e.message}`);
      }
    },
  },
]);

// 🧠 Main Export
export async function generateMissionFromTasks(quests = [], days = 7) {
  if (!Array.isArray(quests) || quests.length === 0) {
    throw new Error('Quests must be a non-empty array.');
  }

  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new Error('Days must be a number between 1 and 30.');
  }

  try {
  const mission = await chain.invoke({ quests, days });
  // The chain returns an object { parse: <validatedMission> } per last mapping.
  // Return the validated mission directly for consumers.
  return mission.parse;
  } catch (error) {
    throw new Error(`Failed to generate mission: ${error.message}`);
  }
}

// Example usage with async context
// (async () => {
//   const quests = [
//     { title: 'Run 5km daily', statAffected: 'endurance', xp: 50 },
//     { title: 'Complete 20 push-ups', statAffected: 'strength', xp: 30 },
//   ];
//   const days = 7;

//   try {
//     const mission = await generateMissionFromTasks(quests, days);
//     console.log('Generated Mission:', mission);
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// })();