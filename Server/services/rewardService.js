/**
 * Shared reward application service.
 * Centralizes XP/coin/stat reward logic used by quest and sidequest controllers.
 * Uses UserState multipliers for equipment/skill bonuses.
 */
import { recalcStatLevel, recalcUserLevel } from './levelService.js';
import { getMultipliers } from './multiplierService.js';

/**
 * Apply mission daily/completion rewards to user (with coin multiplier).
 * @param {Object} user - Mongoose user document
 * @param {Object} tracker - Tracker document
 * @returns {Promise<{ gainedXP: number, gainedCoins: number }>}
 */
export const applyMissionReward = async (user, tracker) => {
  const rewardXP = tracker.reward?.xp || 0;
  const rewardCoin = tracker.reward?.coins || 0;
  const isComplete = tracker.daycount >= tracker.duration;

  const multipliers = await getMultipliers(user._id);

  const rawXP = isComplete ? rewardXP : Math.floor(rewardXP / 4);
  const rawCoins = isComplete ? rewardCoin : Math.floor(rewardCoin / 3);

  const gainedXP = rawXP; // Mission XP is general, not stat-specific
  const gainedCoins = Math.round(rawCoins * (multipliers.coins || 1.0));

  user.xp += gainedXP;
  user.coins += gainedCoins;
  recalcUserLevel(user);

  return { gainedXP, gainedCoins };
};

/**
 * Apply stat gain from quest completion with multipliers.
 * @param {Object} user - Mongoose user document
 * @param {string} stat - Stat key (e.g., 'strength')
 * @param {number} xp - Base XP to add to this stat
 * @returns {Promise<number>} Total XP applied (after multiplier)
 */
export const applyStatGain = async (user, stat, xp) => {
  const multipliers = await getMultipliers(user._id);
  const statMultiplier = multipliers[stat] || 1.0;
  const totalXP = Math.round(xp * statMultiplier);
  user.stats[stat].value += totalXP;
  user.xp += totalXP;
  recalcStatLevel(user, stat);
  recalcUserLevel(user);
  return totalXP;
};

/**
 * Apply sidequest rewards to user (with multipliers).
 * @param {Object} user - Mongoose user document
 * @param {Object} evaluated - Sidequest evaluation result { xp, coins, stat, difficulty }
 * @returns {Promise<void>}
 */
export const applySidequestReward = async (user, evaluated) => {
  const multipliers = await getMultipliers(user._id);

  const scaledXP = Math.round(evaluated.xp * (1 + (user.level - 1) * 0.05));
  const scaledCoins = Math.round(evaluated.coins * (multipliers.coins || 1.0) * (1 + (user.level - 1) * 0.05));

  user.xp = (user.xp || 0) + scaledXP;
  user.coins = (user.coins || 0) + scaledCoins;

  const incMap = { trivial: 0, easy: 1, medium: 2, hard: 3 };
  const gain = incMap[evaluated.difficulty] ?? 1;

  if (user.stats && user.stats[evaluated.stat]) {
    const statMult = multipliers[evaluated.stat] || 1.0;
    user.stats[evaluated.stat].value += Math.round(gain * statMult);
    recalcStatLevel(user, evaluated.stat);
  }
  recalcUserLevel(user);

  return {
    xp: scaledXP,
    coins: scaledCoins,
    stat: evaluated.stat,
    statValueGain: Math.round(gain * (multipliers[evaluated.stat] || 1.0)),
  };
};
