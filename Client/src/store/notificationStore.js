// stores/notificationStore.js
import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  queue: [],
  push: (notification) =>
    set((state) => ({ queue: [...state.queue, notification] })),
  shift: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
