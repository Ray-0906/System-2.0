/**
 * Lightweight async event bus.
 * Services emit events, listeners handle side-effects (logging, notifications).
 * All listeners run asynchronously — they never block the main request.
 */
import { EventEmitter } from 'events';

class AsyncEventBus extends EventEmitter {
  /**
   * Emit and swallow listener errors so they never crash the caller.
   */
  emitAsync(event, payload) {
    const listeners = this.listeners(event);
    for (const fn of listeners) {
      try {
        const result = fn(payload);
        // If the listener returns a promise, catch its errors silently
        if (result && typeof result.catch === 'function') {
          result.catch(err => console.error(`[EventBus] Listener error on "${event}":`, err.message));
        }
      } catch (err) {
        console.error(`[EventBus] Sync listener error on "${event}":`, err.message);
      }
    }
  }
}

const eventBus = new AsyncEventBus();

// Increase limit — we may have many listeners across modules
eventBus.setMaxListeners(30);

export default eventBus;

/* ──────────────────────────────────
   Event names (exported for consistency):
   ────────────────────────────────── */
export const Events = {
  QUEST_COMPLETED:      'quest:completed',
  DAILY_COMPLETED:      'daily:completed',
  MISSION_COMPLETED:    'mission:completed',
  MISSION_JOINED:       'mission:joined',
  EQUIPMENT_PURCHASED:  'equipment:purchased',
  SKILL_UNLOCKED:       'skill:unlocked',
  RANK_ASCENDED:        'rank:ascended',
  PENALTY_APPLIED:      'penalty:applied',
  SIDEQUEST_COMPLETED:  'sidequest:completed',
  SIDEQUEST_CREATED:    'sidequest:created',
  TITLE_UNLOCKED:       'title:unlocked',
};
