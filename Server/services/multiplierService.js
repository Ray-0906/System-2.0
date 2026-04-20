/**
 * Multiplier Service
 * Calculates and maintains per-stat and coin multipliers
 * based on owned equipment and unlocked skills.
 */
import { UserState } from '../Models/userState.js';
import { Equiment } from '../Models/inventory.js';
import { Skill } from '../Models/skill.js';

const STAT_KEYS = ['strength', 'intelligence', 'agility', 'endurance', 'charisma'];
const COIN_PENALTY_FACTOR = 0.95;
const DEFAULT_MULTIPLIERS = {
  strength: 1.0,
  intelligence: 1.0,
  agility: 1.0,
  endurance: 1.0,
  charisma: 1.0,
  coins: 1.0,
};

const round2 = (value) => Math.round(value * 100) / 100;

/**
 * Recalculate all multipliers for a user based on their equipment and skills.
 * Called after buyEquipment or unlockSkill.
 * @param {string} userId
 * @param {Array} equimentIds - User's equipment ObjectIds
 * @param {Array} skillIds - User's skill ObjectIds
 * @returns {Object} The updated multipliers
 */
export const recalcMultipliers = async (userId, equimentIds = [], skillIds = []) => {
  const existingState = await UserState.findOne({ userId });
  const coinPenaltyActive = Boolean(existingState?.temporary?.coinPenaltyActive);
  const multipliers = { ...DEFAULT_MULTIPLIERS };

  // 1. Aggregate equipment effects
  if (equimentIds.length > 0) {
    const equipment = await Equiment.find({ _id: { $in: equimentIds } });
    for (const item of equipment) {
      if (!item.effect?.stat || !item.effect?.bonus) continue;
      if (item.effect.stat === 'all') {
        // Apply to all stats
        for (const key of STAT_KEYS) {
          multipliers[key] += item.effect.bonus;
        }
      } else if (item.effect.stat === 'coins') {
        multipliers.coins += item.effect.bonus;
      } else if (multipliers[item.effect.stat] !== undefined) {
        multipliers[item.effect.stat] += item.effect.bonus;
      }
    }
  }

  // 2. Aggregate skill effects
  if (skillIds.length > 0) {
    const skills = await Skill.find({ _id: { $in: skillIds } });
    for (const skill of skills) {
      if (!skill.effect?.type || !skill.effect?.value) continue;

      if (skill.effect.type === 'xp_multiplier') {
        if (skill.effect.stat === 'all') {
          for (const key of STAT_KEYS) {
            multipliers[key] *= skill.effect.value;
          }
        } else if (multipliers[skill.effect.stat] !== undefined) {
          multipliers[skill.effect.stat] *= skill.effect.value;
        }
      } else if (skill.effect.type === 'coin_multiplier') {
        multipliers.coins *= skill.effect.value;
      } else if (skill.effect.type === 'stat_bonus') {
        // Flat additive bonus
        if (skill.effect.stat === 'all') {
          for (const key of STAT_KEYS) {
            multipliers[key] += skill.effect.value;
          }
        } else if (multipliers[skill.effect.stat] !== undefined) {
          multipliers[skill.effect.stat] += skill.effect.value;
        }
      }
    }
  }

  // 3. Round multipliers to 2 decimal places
  for (const key of Object.keys(multipliers)) {
    multipliers[key] = round2(multipliers[key]);
  }

  // 4. Preserve active temporary streak-break coin penalty across recalculations.
  if (coinPenaltyActive) {
    multipliers.coins = round2((multipliers.coins || 1.0) * COIN_PENALTY_FACTOR);
  }

  // 5. Upsert into UserState
  const userState = await UserState.findOneAndUpdate(
    { userId },
    {
      multipliers,
      temporary: {
        coinPenaltyActive,
      },
      updatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return userState.multipliers;
};

/**
 * Get multipliers for a user. Creates defaults if none exist.
 * @param {string} userId
 * @returns {Object} The multipliers object
 */
export const getMultipliers = async (userId) => {
  const userState = await UserState.findOne({ userId });
  if (userState) return userState.multipliers;

  // Create default entry
  const newState = await UserState.create({
    userId,
    multipliers: { ...DEFAULT_MULTIPLIERS },
    temporary: { coinPenaltyActive: false },
  });
  return newState.multipliers;
};

/**
 * Apply a temporary -5% coin multiplier penalty once per streak break.
 * This penalty stays active until the next completed daily cycle.
 * @param {string} userId
 * @returns {Promise<Object>} Updated multipliers
 */
export const applyTemporaryCoinPenalty = async (userId) => {
  let userState = await UserState.findOne({ userId });

  if (!userState) {
    userState = await UserState.create({
      userId,
      multipliers: { ...DEFAULT_MULTIPLIERS },
      temporary: { coinPenaltyActive: false },
    });
  }

  if (userState.temporary?.coinPenaltyActive) {
    return userState.multipliers;
  }

  userState.multipliers.coins = round2((userState.multipliers.coins || 1.0) * COIN_PENALTY_FACTOR);
  userState.temporary = {
    ...(userState.temporary || {}),
    coinPenaltyActive: true,
  };
  userState.updatedAt = new Date();
  await userState.save();

  return userState.multipliers;
};

/**
 * Clear temporary streak-break coin penalty on next completed daily cycle.
 * @param {string} userId
 * @returns {Promise<Object|null>} Updated multipliers or null if user state doesn't exist
 */
export const clearTemporaryCoinPenalty = async (userId) => {
  const userState = await UserState.findOne({ userId });
  if (!userState) return null;

  if (!userState.temporary?.coinPenaltyActive) {
    return userState.multipliers;
  }

  userState.multipliers.coins = round2((userState.multipliers.coins || 1.0) / COIN_PENALTY_FACTOR);
  userState.temporary = {
    ...(userState.temporary || {}),
    coinPenaltyActive: false,
  };
  userState.updatedAt = new Date();
  await userState.save();

  return userState.multipliers;
};
