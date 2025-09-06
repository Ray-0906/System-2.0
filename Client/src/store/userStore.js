import { create } from "zustand";

export const useUserStore = create((set) => ({
  user: null,
  initialized: false,
  setUser: (userData) => set({ user: userData }),
  setInitialized: () => set({ initialized: true }),
  reset: () => set({ user: null }),
  updateStats: (stat, value, level) =>
    set((state) => {
      if (!state.user) return {};
      return {
        user: {
          ...state.user,
          stats: {
            ...state.user.stats,
            [stat]: { value, level },
          },
        },
      };
    }),

  updateUserProgress: ({ xp, level, stat, statValue, statLevel }) =>
    set((state) => {
      if (!state.user) return {};
      return {
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
      };
    }),

  updateXP: (xp) => set((state) => (state.user ? { user: { ...state.user, xp } } : {})),
  updateCoin: (coins) => set((state) => (state.user ? { user: { ...state.user, coins } } : {})),
  updateLevel: (level) => set((state) => (state.user ? { user: { ...state.user, level } } : {})),
  updateBuy: (id, name, icon, description) =>
    set((s) => {
      if (!s.user) return {};
      const prevEquipment = s.user.equiments ?? [];
      if (prevEquipment.some((e) => e.id === id)) return {};
      return {
        user: {
          ...s.user,
          equiments: [...prevEquipment, { id, name, icon, description }],
        },
      };
    }),
  unlockSkill: (id, name, icon, description) =>
    set((s) => {
      if (!s.user) return {};
      const prevskills = s.user.skills ?? [];
      if (prevskills.some((e) => e.id === id)) return {};
      return {
        user: {
          ...s.user,
          skills: [...prevskills, { id, name, icon, description }],
        },
      };
    }),
}));
