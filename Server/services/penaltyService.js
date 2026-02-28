/**
 * Shared penalty application logic.
 * Single source of truth for how penalties affect users.
 */
import { User } from '../Models/user.js';
import { userLevelThresholds } from '../libs/levelling.js';

/**
 * Apply a penalty to a user (deduct XP and coins, potentially de-level).
 * @param {string} penaltyType - 'missionFail' or 'skip'
 * @param {string} trackerId - Tracker ID (for missionFail tracker removal)
 * @param {string} userId - User ID
 * @param {number} statPenalty - Amount to deduct from XP
 * @param {number} coinPenalty - Amount to deduct from coins
 * @returns {{ level: number, xp: number, coins: number }}
 */
export const applyPenalty = async (penaltyType, trackerId, userId, statPenalty, coinPenalty) => {
  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found');
    return null;
  }

  // Deduct coins (clamped to 0)
  user.coins = Math.max(0, user.coins - coinPenalty);

  // Deduct XP and de-level if needed
  let lv = user.level;
  let uxp = user.xp - statPenalty;

  while (uxp < 0 && lv > 1) {
    uxp += userLevelThresholds[lv]; // add back current level's threshold
    lv--;                            // then drop the level
  }
  uxp = Math.max(0, uxp);

  // Remove tracker from user on mission fail
  if (penaltyType === 'missionFail') {
    user.trackers.pull(trackerId);
  }

  user.level = lv;
  user.xp = uxp;

  await user.save();

  return {
    level: lv,
    xp: uxp,
    coins: user.coins,
  };
};
