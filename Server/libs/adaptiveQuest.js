import mongoose from 'mongoose';
import {Tracker} from '../Models/tracker.js';
import {Quest} from '../Models/quest.js'; // Adjust path as needed
 // Adjust path as needed
 // Assuming a Quest model exists

import { ChatMistralAI } from '@langchain/mistralai';
import 'dotenv/config';

const model = new ChatMistralAI({
  model: 'mistral-large-latest',
  temperature: 0.6,
  maxTokens: 500,
  apiKey: process.env.MISTRAL_API_KEY ,
});

export async function upgradeQuests(userId, trackerId) {
  // Find the user's tracker and populate related fields
  const tracker = await Tracker.findOne({ _id:trackerId })
    .populate('currentQuests remainingQuests questCompletion');

  if (!tracker) {
    throw new Error('Tracker not found');
  }

  // Check streak threshold
  if (tracker.streak < 5) {
    return { message: 'Streak must be 5 or higher to upgrade quests' };
  }

  // Analyze performance and previous quests
  const currentQuests = tracker.currentQuests;
  const totalQuests = currentQuests.length;
  const completedQuests = tracker.questCompletion.size || 0;
  const completionRate = totalQuests > 0 ? (completedQuests / totalQuests) * 100 : 0;
  const penaltiesCount = tracker.penaltiesApplied.length;
  const rankDifficulty = { E: 1, D: 2, C: 3, B: 4, A: 5, S: 6 }[tracker.rank] || 1;
  const baseDifficulty = currentQuests.reduce((sum, quest) => sum + quest.xp, 0) / totalQuests;

  // Calculate new difficulty based on performance
  const streakBoost = tracker.streak * 2;
  const penaltyPenalty = penaltiesCount * 5;
  const completionBoost = completionRate * 0.5;
  const newDifficulty = baseDifficulty + streakBoost - penaltyPenalty + completionBoost;
  const maxXp = Math.min(50, Math.max(1, Math.round(newDifficulty)));

  // Generate new quests using AI based on previous ones
  const prompt = `You are a quest designer for a Solo Leveling-style gamification app. Based on the following quests, create upgraded versions with increased difficulty, keeping the original titles as a base and aligning with fitness goals. Do not add new quests, only upgrade the existing ones. Output a JSON array of objects, each with 'title', 'statAffected', and 'xp' (1-50), reflecting a harder challenge. Quests: ${JSON.stringify(currentQuests.map(q => ({ title: q.title, statAffected: q.statAffected, xp: q.xp })))}
  Example: If a quest is "20 push-ups" (strength, 20 xp), upgrade to "30 push-ups" (strength, 30 xp) or "10 advanced pike push-ups" (strength, 35 xp).`;

  const response = await model.invoke(prompt);
  const match = response.content.match(/```json\n([\s\S]+?)\n```/);
  const jsonStr = match ? match[1].trim() : response.content.trim();
  const newQuests = JSON.parse(jsonStr);

  // Validate and save new quests
  const validatedQuests = newQuests.map(quest => ({
    title: quest.title,
    statAffected: quest.statAffected,
    xp: Math.min(50, Math.max(1, quest.xp)),
  }));
  const savedQuests = await Quest.insertMany(validatedQuests.map(quest => new Quest(quest)));
  const newQuestIds = savedQuests.map(q => q._id);

  // Update tracker with new quest IDs
  tracker.currentQuests = newQuestIds;
  tracker.remainingQuests = newQuestIds;
  tracker.questCompletion.clear();
  tracker.daycount = 0;
  tracker.lastUpdated = new Date();
  tracker.rewardsClaimed = false;

  // Adjust rank, rewards, and penalties based on new difficulty
  if (newDifficulty > 40 && tracker.rank !== 'S') {
    const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S'];
    const currentRankIdx = rankOrder.indexOf(tracker.rank);
    const nextRankIdx = Math.min(rankOrder.length - 1, currentRankIdx + 1);
    tracker.rank = rankOrder[nextRankIdx];
    tracker.reward = {
      xp: Math.min(500, tracker.reward.xp + 50),
      coins: Math.min(100, tracker.reward.coins + 10),
  specialReward: nextRankIdx >= rankOrder.indexOf('B') ? ['common', 'rare', 'epic'][Math.floor((rankDifficulty - 2) / 2)] : null,
    };
    tracker.penalty = {
      missionFail: { coins: Math.min(50, tracker.penalty.missionFail.coins + 5), stats: Math.min(5, tracker.penalty.missionFail.stats + 1) },
      skip: { coins: Math.min(20, tracker.penalty.skip.coins + 2), stats: Math.min(2, tracker.penalty.skip.stats + 1) },
    };
  }

  await tracker.save();

  return { message: 'Quests upgraded successfully', updatedTracker: tracker };
}

