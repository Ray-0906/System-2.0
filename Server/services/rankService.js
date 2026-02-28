/**
 * Shared rank evaluation service.
 * Extracts hunter score calculation and rank determination logic.
 */

const rankOrder = ['E', 'D', 'C', 'B', 'A', 'S'];
const rankThresholds = { E: 0, D: 300, C: 600, B: 1000, A: 1500, S: 2200 };

/**
 * Calculate hunter score from user data.
 * @param {Object} user - Mongoose user document
 * @param {Array} trackers - User's tracker documents
 * @returns {{ totalHunterScore: number, components: Object, newRank: string }}
 */
export const evaluateHunterScore = (user, trackers) => {
  const statLevels = Object.values(user.stats).map(s => s.level || 1);
  const totalStatLevels = statLevels.reduce((sum, l) => sum + l, 0);

  const totalMissions = user.totalMission || 0;
  const completedMissions = user.completed_trackers?.length || 0;
  const successRate = totalMissions > 0 ? completedMissions / totalMissions : 0;

  const avgStreak = trackers.length
    ? trackers.reduce((sum, t) => sum + (t.streak || 0), 0) / trackers.length
    : 0;

  const components = {
    xpScore: user.xp * 0.3,
    statScore: totalStatLevels * 10 * 0.3,
    missionScore: totalMissions * 20 * 0.2,
    successScore: successRate * 100 * 0.1,
    streakScore: avgStreak * 5 * 0.1,
  };

  const totalHunterScore = Object.values(components).reduce((a, b) => a + b, 0);

  let newRank = user.rank;
  for (const [rank, threshold] of Object.entries(rankThresholds)) {
    if (totalHunterScore >= threshold) newRank = rank;
  }

  return {
    totalHunterScore,
    components,
    newRank,
    details: { totalStatLevels, totalMissions, completedMissions, successRate, avgStreak },
  };
};

/**
 * Apply rank ascension rewards if rank increased.
 * @param {Object} user - Mongoose user document
 * @param {string} newRank - The evaluated new rank
 * @returns {{ ascended: boolean, reward?: Object }}
 */
export const applyRankAscension = (user, newRank) => {
  const currentIdx = rankOrder.indexOf(user.rank);
  const newIdx = rankOrder.indexOf(newRank);

  if (newIdx <= currentIdx) {
    return { ascended: false };
  }

  const diff = newIdx - currentIdx;
  const rewardXP = 400 * diff;
  const rewardCoins = 1500 * diff;
  const title = `${newRank}-Rank Hunter`;

  user.rank = newRank;
  user.xp += rewardXP;
  user.coins += rewardCoins;
  if (!user.titles.includes(title)) user.titles.push(title);

  return {
    ascended: true,
    reward: { xp: rewardXP, coins: rewardCoins, title },
  };
};

export { rankOrder, rankThresholds };
