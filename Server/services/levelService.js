/**
 * Shared level-up utility functions.
 * Unified to use the THRESHOLD model (XP is subtracted on level-up).
 */
import { statLevelThresholds, userLevelThresholds } from '../libs/levelling.js';

/**
 * Recalculate user level based on XP.
 * Threshold model: XP IS subtracted on level-up.
 * @param {Object} user - Mongoose user document
 * @returns {boolean} Whether a level-up occurred
 */
export const recalcUserLevel = (user) => {
  let leveledUp = false;
  while (
    userLevelThresholds[user.level] &&
    user.xp >= userLevelThresholds[user.level]
  ) {
    user.xp -= userLevelThresholds[user.level];
    user.level += 1;
    leveledUp = true;
  }
  return leveledUp;
};

/**
 * Recalculate a specific stat's level based on value.
 * Threshold model: stat value IS subtracted on level-up.
 * @param {Object} user - Mongoose user document
 * @param {string} stat - Stat key (e.g., 'strength')
 * @returns {boolean} Whether a stat level-up occurred
 */
export const recalcStatLevel = (user, stat) => {
  let leveledUp = false;
  const statObj = user.stats[stat];
  while (
    statLevelThresholds[statObj.level] &&
    statObj.value >= statLevelThresholds[statObj.level]
  ) {
    statObj.value -= statLevelThresholds[statObj.level];
    statObj.level += 1;
    leveledUp = true;
  }
  return leveledUp;
};

/**
 * Apply XP gain to user, recalculate levels, and return changes.
 * @param {Object} user - Mongoose user document
 * @param {number} xpGain - XP to add
 * @param {string} stat - Stat key to update
 * @param {number} statXp - XP to add to the stat
 * @returns {{ userLeveledUp: boolean, statLeveledUp: boolean }}
 */
export const applyXPGain = (user, xpGain, stat, statXp) => {
  user.xp += xpGain;
  user.stats[stat].value += statXp;

  const userLeveledUp = recalcUserLevel(user);
  const statLeveledUp = recalcStatLevel(user, stat);

  return { userLeveledUp, statLeveledUp };
};
