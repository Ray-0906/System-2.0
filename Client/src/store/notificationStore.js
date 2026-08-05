import { create } from 'zustand';

const MAX_QUEUE = 5;

export const useNotificationStore = create((set) => ({
  queue: [],
  push: (notification) =>
    set((state) => ({
      queue: [...state.queue, notification].slice(-MAX_QUEUE),
    })),
  shift: () => set((state) => ({ queue: state.queue.slice(1) })),
}));
