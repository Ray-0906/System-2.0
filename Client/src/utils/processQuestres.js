// utils/processQuestResponse.js
// import { useUserStore } from '@/stores/userStore';

import { useNotificationStore } from "../store/notificationStore";
import { useUserStore } from "../store/userStore";

export const processQuestResponse = (res, qxp) => {
  if (!res) return;

  const { statUpdated, xp: newXP, userLevel: newLevel,coins:newCoins } = res;

  const user = useUserStore.getState().user;
  const push = useNotificationStore.getState().push;
  const updateStats = useUserStore.getState().updateStats;
  const updateXP = useUserStore.getState().updateXP;
  const updateCoin = useUserStore.getState().updateCoin;
  const updateLevel = useUserStore.getState().updateLevel;

  // XP Change
  const xpDelta = newXP - user.xp;
  if (xpDelta !== 0) {
    push({
      type: 'xp',
      delta: xpDelta,
      newValue: newXP,
    });
    updateXP(newXP);
  }

  const delCoin=newCoins-user.coins;
  if(delCoin!=0){
   push({
      type: 'coins',
      delta: delCoin,
      newValue: newCoins,
      isPenalty: false,
    });
    updateCoin(newCoins);
  }

  // Level Change
  const levelDelta = newLevel - user.level;
  if (levelDelta > 0) {
    push({
      type: 'level',
      delta: levelDelta,
      newValue: newLevel,
    });
    updateLevel(newLevel);
  }

  // Stat Change
  if (statUpdated) {
    const { stat, value: newVal, level: newStatLevel } = statUpdated;
    const prevStat = user.stats[stat];
    const lvlDelta = newStatLevel - prevStat.level;

    push({
      type: 'stat',
      key: stat,
      delta: qxp,
      newValue: newVal,
    });

    if (lvlDelta > 0) {
      push({
        type: 'stat',
        key: stat,
        delta: 0,
        newValue: `Lvl ${newStatLevel}`,
      });
    }

    // use your update method
    updateStats(stat, newVal, newStatLevel);
  }
};





/**
 * Processes penalty response and pushes notifications for negative changes
 * @param {Object} updated - Updated user data from API
 * @param {number} xpDelta - XP change from API
 */
export function processPenaltyResponse(updated, xpDelta) {
  const push = useNotificationStore.getState().push;
  const user = useUserStore.getState().user;
    const updateXP = useUserStore.getState().updateXP;
  const updateCoin = useUserStore.getState().updateCoin;
  const updateLevel = useUserStore.getState().updateLevel;
  const previous = {
    xp: user.xp || 0,
    level: user.level || 0,
    coins: user.coins || 0,
    stats: user.stats || {}, // Safe default for optional stats
  };

  // --- Handle XP change ---
  if (xpDelta !== 0) {
    push({
      type: 'xp',
      delta: xpDelta,
      newValue: updated.xp,
      isPenalty: true,
    });
    updateXP(updated.xp);
  }

  // --- Handle Level change ---
  const levelDelta = updated.level - previous.level;
  if (levelDelta !== 0) {
    push({
      type: 'level',
      newValue: updated.level,
      isPenalty: true,
    });
    updateLevel(updated.level);
  }

  // --- Handle Coin change ---
  const coinDelta = updated.coins - previous.coins;
  if (coinDelta !== 0) {
    push({
      type: 'coins',
      delta: coinDelta,
      newValue: updated.coins,
      isPenalty: true,
    });
    updateCoin(updated.coins);
  }

  // --- Handle Stats changes ---
  if (updated.stats && previous.stats) {
    Object.keys(updated.stats).forEach((key) => {
      const delta = updated.stats[key].value - (previous.stats[key]?.value || 0);
      if (delta !== 0) {
        push({
          type: 'stat',
          key,
          delta,
          newValue: `Lv:${updated.stats[key].level}`,
          isPenalty: true,
        });
      }
    });
  }
}