/**
 * Event Queue — BullMQ queue for async event processing.
 *
 * Single responsibility: define the queue and expose an enqueue() helper.
 * Workers in ../workers/ consume from this queue independently.
 *
 * If Redis is not connected, enqueue() is a no-op.
 */
import { Queue } from 'bullmq';
import { connection } from './connection.js';

const QUEUE_NAME = 'system2-events';

let queue = null;

if (connection) {
  queue = new Queue(QUEUE_NAME, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: { count: 100 },  // keep last 100 for debugging
      removeOnFail: { count: 500 },      // keep last 500 for investigation
    },
  });
  console.log(`[Queue] "${QUEUE_NAME}" ready`);
}

/**
 * Push an event to the queue for async processing.
 *
 * @param {Object} eventData - { userId, type, summary, eventLogId }
 *
 * No-op if Redis is not configured. Never throws.
 */
export const enqueue = (eventData) => {
  if (!queue) return; // graceful degradation

  queue.add(eventData.type, eventData).catch(err =>
    console.error('[Queue] Failed to enqueue:', err.message)
  );
};

export { queue, QUEUE_NAME };
