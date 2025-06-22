import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { z } from 'zod';
import { ChatMistralAI } from '@langchain/mistralai';
import 'dotenv/config';

// Define the expected JSON schema for the LLM response, aligned with Mongoose questSchema
const MissionSchema = z.object({
  title: z.string().min(1, 'Mission title is required'),
  refinedDescription: z.string().min(1, 'Refined description is required'),
  quests: z
    .array(
      z.object({
        title: z.string().min(1, 'Quest title is required'),
        statAffected: z.enum(['strength', 'intelligence', 'agility', 'endurance', 'charisma'], {
          message: 'Stat must be one of: strength, intelligence, agility, endurance, charisma',
        }),
        xp: z.number().int().nonnegative('Quest XP must be a non-negative integer'),
      })
    )
    .max(4, 'Maximum of 4 quests allowed')
    .min(1, 'At least one quest is required'),
  reward: z.object({
    xp: z.number().int().nonnegative('Mission XP must be a non-negative integer'),
    coins: z.number().int().nonnegative('Coins must be a non-negative integer'),
    specialReward: z.enum(['common', 'rare', 'epic']).nullable(),
  }, { message: 'Reward object is required' }),
  penalty: z.object({
    missionFail: z.object({
      coins: z.number().int().nonnegative('Mission fail coins must be a non-negative integer'),
      stats: z.number().int().nonnegative('Mission fail stats must be a non-negative integer'),
    }, { message: 'Mission fail penalty is required' }),
    skip: z.object({
      coins: z.number().int().nonnegative('Skip coins must be a non-negative integer'),
      stats: z.number().int().nonnegative('Skip stats must be a non-negative integer'),
    }, { message: 'Skip penalty is required' }),
  }, { message: 'Penalty object is required' }),
  rank: z.enum(['E', 'D', 'C', 'B', 'A', 'S'], { message: 'Rank must be one of: E, D, C, B, A, S' }),
});

// Initialize the Mistral AI model
const model = new ChatMistralAI({
  model: 'mistral-large-latest',
  temperature: 0.6,
  maxTokens: 1500,
  apiKey: process.env.MISTRAL_API_KEY,
});

// Function to escape curly braces in a string for PromptTemplate
const escapeCurlyBraces = (str) => {
  return str.replace(/{/g, '{{').replace(/}/g, '}}');
};

// Define the prompt template with escaped backticks and curly braces
const prompt = PromptTemplate.fromTemplate(`
You are a mission generator for a life gamification app like Solo Leveling. Your task is to generate a structured JSON response based on the user’s input description and number of days.

Inputs:
- Raw user description: {description}
- Number of days: {days}

Instructions:
1. Refine the user's raw description into a polished, concise mission description (50-100 words).
2. Generate a mission title (5-10 words) that summarizes the mission.
3. Generate 1-4 unique daily quests. Each quest MUST have:
   - title: A short, actionable task name (5-15 words)
   - statAffected: Exactly one of: strength, intelligence, agility, endurance, charisma
   - xp: A positive integer (1-50 based on quest difficulty)
4. Set a rank from: E, D, C, B, A, S (S is hardest), based on mission difficulty.
5. Set mission rewards scaled with difficulty:
   - xp: A positive integer (50-500 based on rank, sum of quest XP or higher)
   - coins: A positive integer (10-100 based on rank)
   - specialReward: "common", "rare", or "epic" for ranks B, A, S; null for E, D, C
6. Generate penalties based on mission rank:
   - missionFail: {{ coins: number, stats: number }} (higher for harder ranks, e.g., 10-50 coins, 1-5 stats)
   - skip: {{ coins: number, stats: number }} (lighter than missionFail, e.g., 5-20 coins, 0-2 stats)
7. Ensure ALL fields in the schema are included, even if null or empty where allowed.
8. Output MUST be valid JSON wrapped in a markdown code block (\`\`\`json\n<your_json>\n\`\`\`).
9. Do NOT include any additional text, explanations, or comments outside the code block.

The JSON MUST strictly follow this schema:
{json_schema}

Example output for reference:
\`\`\`json
{{
  "title": "Fitness Journey",
  "refinedDescription": "Embark on a week-long fitness quest to boost endurance and strength.",
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

// Create a chain with structured output parsing
const chain = RunnableSequence.from([
  {
    description: (input) => input.description,
    days: (input) => input.days,
    json_schema: (input) => escapeCurlyBraces(JSON.stringify(MissionSchema.shape, null, 2)),
  },
  prompt,
  model,
  {
    parse: (output) => {
    //   console.log('Raw LLM output:', output); // Log for debugging
      try {
        // Extract content from AIMessage object
        const content = output.content || output;
        if (typeof content !== 'string') {
          throw new Error('LLM output content is not a string');
        }
        // console.log('Extracted content:', content); // Log extracted content

        // Extract JSON from markdown code block
        let jsonString = content;
        const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          jsonString = jsonMatch[1].trim();
        } else {
          // Fallback: Try parsing the content directly if no code block
          console.warn('No JSON code block found; attempting to parse raw content');
          jsonString = jsonString.trim();
          if (!jsonString.startsWith('{') || !jsonString.endsWith('}')) {
            throw new Error('Output is not valid JSON');
          }
        }
        // console.log('Extracted JSON string:', jsonString); // Log JSON string

        const parsed = JSON.parse(jsonString);
        return MissionSchema.parse(parsed); // Validate with Zod
      } catch (err) {
        throw new Error(`Failed to parse or validate LLM response: ${err.message}`);
      }
    },
  },
]);

// Export the mission generator function
export async function generateMissionWithLLM(description, days) {
  // Input validation
  if (typeof description !== 'string' || description.trim().length === 0) {
    throw new Error('Description must be a non-empty string.');
  }
  if (description.trim().length < 10) {
    throw new Error('Description must be at least 10 characters long for clarity.');
  }
  if (!Number.isInteger(Number(days)) || Number(days) <= 0) {
    throw new Error('Days must be a positive integer.');
  }
  if (Number(days) > 30) {
    throw new Error('Days cannot exceed 30 for mission duration.');
  }

  // Sanitize inputs to prevent prompt injection
  const sanitizedDescription = description.replace(/[\n\r\t]/g, ' ').trim();
  const sanitizedDays = Math.floor(Number(days));

  // Check for API key
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not set in environment variables.');
  }

//   Log inputs for debugging
//   console.log('Input description:', sanitizedDescription);
//   console.log('Input days:', sanitizedDays);

  try {
    // Log formatted prompt for debugging
    const formattedPrompt = await prompt.format({
      description: sanitizedDescription,
      days: sanitizedDays,
      json_schema: escapeCurlyBraces(JSON.stringify(MissionSchema.shape, null, 2)),
    });
    // console.log('Formatted prompt:', formattedPrompt);

    const result = await chain.invoke({
      description: sanitizedDescription,
      days: sanitizedDays,
    });
    return result.parse;
  } catch (err) {
    console.error('Error generating mission:', err.message);
    throw new Error(`Failed to generate mission: ${err.message}`);
  }
}

// async function main() {
//   try {
//     const mission = await generateMissionWithLLM('want to build a healty physique thorugh basic excise like pushups', 30);
//     console.log(mission);
//   } catch (err) {
//     console.error(err.message);
//   }
// }

// main();