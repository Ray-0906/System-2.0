import { create } from 'zustand';

export const useUserStore = create((set) => ({
  user: null,
  setUser: (userData) => set({ user: userData }),
 
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
    
  updateXP: (xp) => set((state) => ({ user: { ...state.user, xp } })),
  updateLevel: (level) => set((state) => ({ user: { ...state.user, level } }))
}));
