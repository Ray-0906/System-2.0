/**
 * SkillUnlockService — skill unlock business logic.
 * Extracted from skillController.js for clean separation.
 */
import { ServiceError } from '../utils/serviceError.js';
import { userRepo } from '../repositories/userRepository.js';
import { skillRepo } from '../repositories/skillRepository.js';
import { recalcMultipliers } from './multiplierService.js';
import eventBus, { Events } from '../events/eventBus.js';

/**
 * Unlock a skill for a user.
 * @param {string} userId
 * @param {string} skillId
 * @returns {object} { message, skillId, multipliers }
 */
export const unlockSkill = async (userId, skillId) => {
  const skill = await skillRepo.findById(skillId);
  if (!skill) throw new ServiceError('Skill not found', 404);

  const user = await userRepo.findById(userId);
  if (!user) throw new ServiceError('User not found', 404);

  // Prevent duplicate
  if (user.skills.includes(skillId)) {
    throw new ServiceError('Skill already unlocked', 409);
  }

  // Level check
  if (user.level < skill.minLevel) {
    throw new ServiceError(`Requires level ${skill.minLevel}`, 403);
  }

  // Stat requirements
  const unmet = skill.statRequired.find(req => {
    const userValue = user.stats[req.stat]?.level || 0;
    return userValue < req.value;
  });
  if (unmet) {
    throw new ServiceError(
      `Insufficient ${unmet.stat}. Required: ${unmet.value}`,
      403
    );
  }

  // Unlock
  user.skills.push(skill._id);
  await userRepo.save(user);

  // Recalculate multipliers
  const multipliers = await recalcMultipliers(userId, user.equiments, user.skills);

  // Emit event
  eventBus.emitAsync(Events.SKILL_UNLOCKED, {
    userId,
    skillId: skill._id,
    skillName: skill.name,
  });

  return {
    message: `${skill.name} unlocked successfully!`,
    skillId: skill._id,
    multipliers,
  };
};
