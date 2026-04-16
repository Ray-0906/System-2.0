/**
 * ShopService — all equipment purchase business logic.
 * Extracted from shopController.js for clean separation.
 */
import { ServiceError } from '../utils/serviceError.js';
import { userRepo } from '../repositories/userRepository.js';
import { equipmentRepo } from '../repositories/equipmentRepository.js';
import { recalcMultipliers } from './multiplierService.js';
import eventBus, { Events } from '../events/eventBus.js';

const STAT_KEYS = ['strength', 'agility', 'intelligence', 'endurance'];

/**
 * Purchase equipment for a user.
 * @param {string} userId
 * @param {string} equipmentId
 * @returns {object} { message, multipliers, updatedStats, coins, appliedBonuses }
 */
export const purchaseEquipment = async (userId, equipmentId) => {
  if (!equipmentId) throw new ServiceError('Equipment ID is required.');

  const equipment = await equipmentRepo.findById(equipmentId);
  if (!equipment) throw new ServiceError('Equipment not found.', 404);

  const user = await userRepo.findById(userId);
  if (!user) throw new ServiceError('User not found.', 404);

  if (user.equiments.includes(equipmentId)) {
    throw new ServiceError('You already own this equipment.', 409);
  }

  if (user.coins < equipment.cost) {
    throw new ServiceError('Not enough coins to buy this equipment.', 400);
  }

  // Deduct coins & add equipment
  user.coins -= equipment.cost;
  user.equiments.push(equipmentId);

  // Apply flat stat level bonuses
  const appliedBonuses = {};
  if (equipment.statBonuses) {
    for (const stat of STAT_KEYS) {
      const bonus = equipment.statBonuses[stat];
      if (bonus && bonus !== 0 && user.stats[stat]) {
        user.stats[stat].level += bonus;
        appliedBonuses[stat] = bonus;
      }
    }
  }

  await userRepo.save(user);

  // Recalculate multipliers
  const multipliers = await recalcMultipliers(userId, user.equiments, user.skills);

  // Emit event for logging / notifications
  eventBus.emitAsync(Events.EQUIPMENT_PURCHASED, {
    userId,
    equipmentId,
    equipmentName: equipment.name,
    cost: equipment.cost,
    appliedBonuses,
  });

  return {
    message: 'Equipment purchased successfully.',
    multipliers,
    updatedStats: user.stats,
    coins: user.coins,
    appliedBonuses,
  };
};
