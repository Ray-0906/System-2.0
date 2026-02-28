import { User } from "../Models/user.js";
import { Equiment } from "../Models/inventory.js";
import { recalcMultipliers } from "../services/multiplierService.js";
import { recalcStatLevel, recalcUserLevel } from "../services/levelService.js";

export const buyEquipment = async(req, res) => {
  try {
    const { equipmentId } = req.body;
    const userId = req.user._id;
    if (!equipmentId) {
      return res.status(400).json({ error: 'Equipment ID is required.' });
    }

    // Server-side price lookup (don't trust client)
    const equipment = await Equiment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found.' });
    }

    const user = await User.findById(userId);
    if (!user) {    
        return res.status(404).json({ error: 'User not found.' });
    }

    // Check for duplicate ownership
    if (user.equiments.includes(equipmentId)) {
      return res.status(400).json({ error: 'You already own this equipment.' });
    }

    // Check if user has enough coins (server-side price)
    if (user.coins < equipment.cost) {
      return res.status(400).json({ error: 'Not enough coins to buy this equipment.' });
    }
    user.coins -= equipment.cost; 
    user.equiments.push(equipmentId);

    // Apply flat stat level bonuses immediately
    const STAT_KEYS = ['strength', 'agility', 'intelligence', 'endurance'];
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

    await user.save();

    // Recalculate multipliers with new equipment
    const multipliers = await recalcMultipliers(userId, user.equiments, user.skills);

    return res.status(200).json({
      message: 'Equipment purchased successfully.',
      multipliers,
      updatedStats: user.stats,
      coins: user.coins,
      appliedBonuses,
    });    
  }
  catch (error) {
    console.error('Error buying equipment:', error);    
    return res.status(500).json({ error: 'Internal server error.' });
    }
}
