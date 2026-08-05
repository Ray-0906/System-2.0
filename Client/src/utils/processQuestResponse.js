import { useNotificationStore } from "../store/notificationStore";
import { useUserStore } from "../store/userStore";

/**
 * Processes a quest completion response — updates stores and pushes notifications.
 * @param {Object} res - Server response with statUpdated, xp, userLevel, coins
 * @param {number} qxp - Quest XP amount (for stat delta display)
 */
export const processQuestResponse = (res, qxp) => {
  if (!res) return;

  const { statUpdated, xp: newXP, userLevel: newLevel, coins: newCoins } = res;
  const user = useUserStore.getState().user;
  if (!user) return;

  const push = useNotificationStore.getState().push;

  // Batch store update — single Zustand write instead of 4 separate ones
  const storeUpdate = { xp: newXP, level: newLevel, coins: newCoins };
  if (statUpdated) {
    storeUpdate.stat = statUpdated.stat;
    storeUpdate.statValue = statUpdated.value;
    storeUpdate.statLevel = statUpdated.level;
  }
  useUserStore.getState().updateUserProgress(storeUpdate);

  // Push notifications for visible changes only
  const xpDelta = newXP - user.xp;
  if (xpDelta !== 0) {
    push({ type: 'xp', delta: xpDelta, newValue: newXP });
  }

  const coinDelta = newCoins - user.coins;
  if (coinDelta !== 0) {
    push({ type: 'coins', delta: coinDelta, newValue: newCoins });
  }

  const levelDelta = newLevel - user.level;
  if (levelDelta > 0) {
    push({ type: 'level', delta: levelDelta, newValue: newLevel });
  }

  if (statUpdated) {
    const { stat, level: newStatLevel } = statUpdated;
    const prevStat = user.stats[stat];
    const lvlDelta = newStatLevel - prevStat.level;

    // Single stat notification — include level-up info if applicable
    push({
      type: 'stat',
      key: stat,
      delta: qxp,
      newValue: lvlDelta > 0 ? `Lvl ${newStatLevel}` : statUpdated.value,
    });
  }
};

/**
 * Processes penalty response — batch updates user and pushes penalty notifications.
 * @param {Object} updated - Updated user data from penalty API
 * @param {number} xpDelta - XP change amount
 */
export function processPenaltyResponse(updated, xpDelta) {
  if (!updated) return;

  const push = useNotificationStore.getState().push;
  const user = useUserStore.getState().user;
  if (!user) return;

  // Batch store update — single setUser write
  useUserStore.getState().setUser({
    ...user,
    xp: updated.xp ?? user.xp,
    level: updated.level ?? user.level,
    coins: updated.coins ?? user.coins,
    stats: updated.stats ?? user.stats,
  });

  // Push notifications
  if (xpDelta !== 0) {
    push({ type: 'xp', delta: xpDelta, newValue: updated.xp, isPenalty: true });
  }

  const levelDelta = (updated.level ?? user.level) - user.level;
  if (levelDelta !== 0) {
    push({ type: 'level', newValue: updated.level, isPenalty: true });
  }

  const coinDelta = (updated.coins ?? user.coins) - user.coins;
  if (coinDelta !== 0) {
    push({ type: 'coins', delta: coinDelta, newValue: updated.coins, isPenalty: true });
  }

  // Single summary notification for all stat changes instead of one per stat
  if (updated.stats && user.stats) {
    const changedStats = Object.keys(updated.stats).filter(
      (key) => updated.stats[key].value !== (user.stats[key]?.value ?? 0)
    );
    if (changedStats.length > 0) {
      push({
        type: 'stat',
        key: changedStats.map((s) => s.toUpperCase()).join(', '),
        delta: -1,
        newValue: `${changedStats.length} stats penalized`,
        isPenalty: true,
      });
    }
  }
}
