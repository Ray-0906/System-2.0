import { create } from "zustand";

export const useUserStore = create((set) => ({
  user: null,
  initialized: false,
  setUser: (userData) => set({ user: userData }),
  setInitialized: () => set({ initialized: true }),
  reset: () => set({ user: null }),
  updateStats: (stat, value, level) =>
    set((state) => ({
      user: {
        ...state.user,
        stats: {
          ...state.user.stats,
          [stat]: {
            value,
            level,
          },
        },
      },
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
  updateLevel: (level) => set((state) => ({ user: { ...state.user, level } })),
  updateBuy: (id, name, icon, description) =>
    set((s) => {
      const prevEquipment = s.user?.equiments ?? [];
      const exists = prevEquipment.some((e) => e.id === id);
      if (exists) return {}; // no update
      return {
        user: {
          ...s.user,
          equiments: [...prevEquipment, { id, name, icon, description }],
        },
      };
    }),
  unlockSkill: (id, name, icon, description) =>
    set((s) => {
      const prevskills = s.user?.skills ?? [];
      const exists = prevskills.some((e) => e.id === id);
      if (exists) return {}; // no update
      return {
        user: {
          ...s.user,
          skills: [...prevskills, { id, name, icon, description }],
        },
      };
    }),
}));
