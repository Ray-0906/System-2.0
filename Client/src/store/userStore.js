import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  setUser: (userData) => set({ user: userData }),
 reset: () => set({ user: null }),
  updateStats: (stat, value, level) =>
    set((state) => ({
      user: {
        ...state.user,
        stats: {
          ...state.user.stats,
          [stat]: {
            value,
            level
          }
        }
      }
    })),

    updateUserProgress: ({ xp, level, stat, statValue, statLevel }) =>
  set((state) => ({
    user: {
      ...state.user,
      xp,
      level,
      stats: {
        ...state.user.stats,
        [stat]: {
          value: statValue,
          level: statLevel,
        },
      },
    },
  })),

  
  updateXP: (xp) => set((state) => ({ user: { ...state.user, xp } })),
  updateCoin: (coins) => set((state) => ({ user: { ...state.user, coins } })),
  updateLevel: (level) => set((state) => ({ user: { ...state.user, level } }))
}));
