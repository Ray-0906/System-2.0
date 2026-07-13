/**
 * RankController — thin HTTP layer for rank ascension evaluation.
 * Business logic lives in rankService.js (already extracted).
 */
import { userRepo } from '../repositories/userRepository.js';
import { trackerRepo } from '../repositories/trackerRepository.js';
import { evaluateHunterScore, applyRankAscension } from '../services/rankService.js';
import { handleServiceError } from '../utils/serviceError.js';
import { ServiceError } from '../utils/serviceError.js';
import eventBus, { Events } from '../events/eventBus.js';

export const evaluateRankAscension = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await userRepo.findById(userId);
    if (!user) throw new ServiceError('User not found', 404);

    const trackers = await trackerRepo.findByUserId(userId);
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

    const { ascended, reward } = applyRankAscension(user, newRank);

    if (ascended) {
      await userRepo.save(user);
      eventBus.emitAsync(Events.RANK_ASCENDED, { userId, newRank, reward });
      return res.status(200).json({ ascended: true, newRank, reward, report });
    }

    return res.status(200).json({ ascended: false, currentRank: user.rank, report });
  } catch (err) {
    return handleServiceError(res, err);
  }
};
