import { User } from "../Models/user.js";


import { Skill } from "../Models/skill.js";
import { Tracker } from "../Models/tracker.js";

export const buyEquipment = async(req, res) => {
  try {
    const { equipmentId ,price} = req.body;
    const userId = req.user._id; // Assuming user ID is available in req.user   
    if (!equipmentId || !price) {
      return res.status(400).json({ error: 'Equipment ID and price are required.' });
    }
    // Find the user
    const user = await User.findById(userId);
    if (!user) {    
        return res.status(404).json({ error: 'User not found.' });
    }

    // Check if user has enough coins
    if (user.coins < price) {
      return res.status(400).json({ error: 'Not enough coins to buy this equipment.' });
    }       
    // Deduct the price from user's coins
    user.coins -= price; 
    user.equiments.push(equipmentId); // Add the equipment to user's equipment list   
    await user.save();
     return res.status(200).json({ message: 'Equipment purchased successfully.' });    
  }
  catch (error) {
    console.error('Error buying equipment:', error);    
    return res.status(500).json({ error: 'Internal server error.' });
    }
}


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

    return res.status(200).json({
      message: `${skill.name} unlocked successfully!`,
      skillId: skill._id,
    });

  } catch (err) {
    console.error('Unlock Skill Error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};



const rankThresholds = {
  E: 0,
  D: 300,
  C: 600,
  B: 1000,
  A: 1500,
  S: 2200,
};

const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S'];

export const evaluateRankAscension = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const trackers = await Tracker.find({ userId });

    // 1. Stat Levels
    const statLevels = Object.values(user.stats).map(stat => stat.level || 1);
    const totalStatLevels = statLevels.reduce((sum, lvl) => sum + lvl, 0);

    // 2. Missions
    const totalMissions = user.totalMission || 0;
    const completedTrackers = user.completed_trackers;
    const completedMissions = completedTrackers.length;
    const successRate = totalMissions > 0 ? completedMissions / totalMissions : 0;

    // 3. Average Streak
    const avgStreak = trackers.length
      ? trackers.reduce((sum, t) => sum + (t.streak || 0), 0) / trackers.length
      : 0;

    // 4. Hunter Score Breakdown
    const hunterScoreComponents = {
      xpScore: user.xp * 0.3,
      statScore: totalStatLevels * 10 * 0.3,
      missionScore: totalMissions * 20 * 0.2,
      successScore: successRate * 100 * 0.1,
      streakScore: avgStreak * 5 * 0.1,
    };

    const totalHunterScore = Object.values(hunterScoreComponents).reduce((a, b) => a + b, 0);

    // 5. Determine new rank
    const rankThresholds = {
      E: 0,
      D: 300,
      C: 600,
      B: 1000,
      A: 1500,
      S: 2200,
    };
    const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S'];

    let newRank = user.rank;
    for (const [rank, threshold] of Object.entries(rankThresholds)) {
      if (totalHunterScore >= threshold) newRank = rank;
    }

    const currentRankIndex = rankOrder.indexOf(user.rank);
    const newRankIndex = rankOrder.indexOf(newRank);

    const report = {
      currentRank: user.rank,
      evaluatedRank: newRank,
      hunterScore: Math.round(totalHunterScore),
      components: {
        xp: user.xp,
        totalStatLevels,
        totalMissions,
        completedMissions,
        successRate: successRate.toFixed(2),
        avgStreak: avgStreak.toFixed(2),
        hunterScoreComponents: Object.entries(hunterScoreComponents).reduce((acc, [key, val]) => {
          acc[key] = Math.round(val);
          return acc;
        }, {}),
      },
    };

    // 6. If Rank Increased
    if (newRankIndex > currentRankIndex) {
      const rankUpDiff = newRankIndex - currentRankIndex;

      const rewardXP = 400 * rankUpDiff;
      const rewardCoins = 1500 * rankUpDiff;
      const title = `${newRank}-Rank Hunter`;

      user.rank = newRank;
      user.xp += rewardXP;
      user.coins += rewardCoins;

      if (!user.titles.includes(title)) user.titles.push(title);
      await user.save();

      return res.status(200).json({
        ascended: true,
        newRank,
        reward: {
          xp: rewardXP,
          coins: rewardCoins,
          title,
        },
        report,
      });
    }

    return res.status(200).json({
      ascended: false,
      currentRank: user.rank,
      report,
    });
  } catch (error) {
    console.error('Rank Ascension Error:', error);
    res.status(500).json({ error: 'Server error during rank evaluation' });
  }
};
