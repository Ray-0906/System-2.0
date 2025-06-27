import { create } from 'zustand';

export const useTrackerStore = create((set) => ({
  trackers: [],
  setTrackers: (trackers) => set({ trackers }),

  updateTracker: (trackerId, updatedData) =>
  set((state) => ({
    trackers: state.trackers.map((t) =>
      t.id === trackerId ? { ...t, ...updatedData } : t
    )
  })),
 updateStreak: (trackerId) =>
  set((state) => ({
    trackers: state.trackers.map((t) =>
      t.id === trackerId
        ? {
            ...t,
            streak: t.streak + 1,
            daycount: t.daycount + 1,
           // if you want to update additional data dynamically
          }
        : t
    ),
  }))


}));
