/**
 * Notification Worker — Pushes real-time events to the frontend via Socket.io.
 *
 * Single responsibility: consume events from the queue and emit
 * WebSocket notifications to the connected user.
 *
 * The frontend receives events like:
 *   { type: 'quest:completed', message: '🎯 +50 STR XP! Streak: 5', ... }
 *
 * If the user is not connected via WebSocket, the notification is silently dropped
 * (they'll see the updates next time they open the app).
 */
import { Worker } from 'bullmq';
import { connection } from '../queue/connection.js';
import { QUEUE_NAME } from '../queue/eventQueue.js';
import { emitToUser } from '../socket/socketManager.js';

// ── Notification message builders ────────────────────

const notificationMessages = {
  'quest:completed':      (d) => `🎯 +${d.data?.xp || '?'} ${d.data?.stat || ''} XP! Streak: ${d.data?.streak || '?'}`,
  'daily:completed':      (d) => `🔥 Daily complete! Streak: ${d.data?.streak || '?'}, Day ${d.data?.daycount || '?'}`,
  'mission:completed':    (d) => `🏆 Mission "${d.data?.missionTitle || '?'}" completed!`,
  'mission:joined':       (d) => `⚔️ Joined mission "${d.data?.missionTitle || '?'}"`,
  'equipment:purchased':  (d) => `🛡️ Purchased "${d.data?.equipmentName || d.data?.itemName || '?'}"`,
  'skill:unlocked':       (d) => `✨ Unlocked skill "${d.data?.skillName || '?'}"`,
  'rank:ascended':        (d) => `👑 Ascended to Rank ${d.data?.newRank || '?'}!`,
  'penalty:applied':      (d) => `⚠️ Penalty: -${d.data?.statPenalty || '?'} XP, -${d.data?.coinPenalty || '?'} coins`,
  'sidequest:completed':  (d) => `🎯 Sidequest "${d.data?.title || '?'}" completed!`,
  'sidequest:created':    (d) => `📝 Created sidequest "${d.data?.title || '?'}"`,
  'title:unlocked':       (d) => `🏅 Earned title "${d.data?.titleName || '?'}"`,
};

if (connection) {
  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { userId, type, summary, data } = job.data;

      // Build user-friendly notification message
      const buildMessage = notificationMessages[type];
      const message = buildMessage ? buildMessage(job.data) : summary;

      // Push to user's WebSocket room
      emitToUser(userId, 'event:logged', {
        type,
        message,
        summary,
        timestamp: new Date().toISOString(),
      });

      return { pushed: true, type, userId };
    },
    {
      connection,
      concurrency: 5, // notifications should be fast
    },
  );

  worker.on('failed', (job, err) => {
    console.error(`[Notification Worker] Job ${job?.id} failed:`, err.message);
  });

  console.log('[Notification Worker] Started (concurrency: 5)');
} else {
  console.warn('[Notification Worker] Redis not configured — worker disabled.');
}
