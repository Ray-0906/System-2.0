import { create } from 'zustand';

export const useTrackerStore = create((set) => ({
  trackers: [],
  setTrackers: (trackers) => set({ trackers }),

  updateTracker: (trackerId, updatedData) =>
  set((state) => ({
    trackers: state.trackers.map((t) =>
      t.id === trackerId ? { ...t, ...updatedData } : t
    )
  }))


}));
