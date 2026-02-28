import { User } from "../Models/user.js";
import { Tracker } from "../Models/tracker.js";
import { evaluateHunterScore, applyRankAscension } from "../services/rankService.js";

export const evaluateRankAscension = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const trackers = await Tracker.find({ userId });

    // Use shared service for score calculation
    const { totalHunterScore, components, newRank, details } = evaluateHunterScore(user, trackers);

    const report = {
      currentRank: user.rank,
      evaluatedRank: newRank,
      hunterScore: Math.round(totalHunterScore),
      components: {
        xp: user.xp,
        totalStatLevels: details.totalStatLevels,
        totalMissions: details.totalMissions,
        completedMissions: details.completedMissions,
        successRate: details.successRate.toFixed(2),
        avgStreak: details.avgStreak.toFixed(2),
        hunterScoreComponents: Object.entries(components).reduce((acc, [key, val]) => {
          acc[key] = Math.round(val);
          return acc;
        }, {}),
      },
    };

    // Use shared service for rank ascension
    const { ascended, reward } = applyRankAscension(user, newRank);

    if (ascended) {
      await user.save();
      return res.status(200).json({ ascended: true, newRank, reward, report });
    }

    return res.status(200).json({ ascended: false, currentRank: user.rank, report });
  } catch (error) {
    console.error('Rank Ascension Error:', error);
    res.status(500).json({ error: 'Server error during rank evaluation' });
  }
};
