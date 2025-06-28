function generateThresholds(maxLevel, baseXP = 10, exponent = 1.7, offset = 0) {
  const thresholds = {};
  let xp = baseXP;
  for (let level = 1; level <= maxLevel; level++) {
    thresholds[level] = Math.floor(xp);
    xp += Math.floor(Math.pow(level + offset, exponent)) + 10;
  }
  return thresholds;
}

// Stat levels
export const statLevelThresholds = generateThresholds(169, 20, 2.1);

// User levels
export const userLevelThresholds = generateThresholds(169, 40, 2.3, 0);
