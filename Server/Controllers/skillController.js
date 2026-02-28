import { User } from "../Models/user.js";
import { Skill } from "../Models/skill.js";
import { recalcMultipliers } from "../services/multiplierService.js";

export const unlockSkill = async (req, res) => {
  const { skillId } = req.body;
  const userId = req.user.id;

  try {
    const skill = await Skill.findById(skillId);
    if (!skill) return res.status(404).json({ message: 'Skill not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicate unlock
    if (user.skills.includes(skillId)) {
      return res.status(400).json({ message: 'Skill already unlocked' });
    }

    // Check level requirement
    if (user.level < skill.minLevel) {
      return res.status(403).json({ message: `Requires level ${skill.minLevel}` });
    }

    // Check stat requirements
    const unmet = skill.statRequired.find(reqStat => {
      const userValue = user.stats[reqStat.stat]?.level || 0;
      return userValue < reqStat.value;
    });

    if (unmet) {
      return res.status(403).json({
        message: `Insufficient ${unmet.stat}. Required: ${unmet.value}`,
      });
    }

    // All conditions met — unlock skill
    user.skills.push(skill._id);
    await user.save();

    // Recalculate multipliers with new skill
    const multipliers = await recalcMultipliers(userId, user.equiments, user.skills);

    return res.status(200).json({
      message: `${skill.name} unlocked successfully!`,
      skillId: skill._id,
      multipliers,
    });

  } catch (err) {
    console.error('Unlock Skill Error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
