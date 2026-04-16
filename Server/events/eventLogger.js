/**
 * EventLogger — wires the EventBus to the EventLog model.
 * Every significant user action gets logged as a human-readable event.
 *
 * After logging:
 *   1. Redis PUBLISH → RAG-Service (Python) for page building
 *   2. BullMQ enqueue → Notification Worker (Node.js) for Socket.io push
 *
 * Import this file once in index.js to activate logging.
 */
import eventBus, { Events } from './eventBus.js';
import { EventLog } from '../Models/eventLog.js';
import { enqueue } from '../queue/eventQueue.js';
import { redisClient } from '../queue/connection.js';

const RAG_CHANNEL = 'system2:events';

// ── Summary builders (pure functions) ────────────────

const summaries = {
  [Events.QUEST_COMPLETED]: (d) =>
    `Completed a quest. Gained ${d.xp} ${d.stat} XP. Current streak: ${d.streak}.`,

  [Events.DAILY_COMPLETED]: (d) =>
    `Finished all daily quests! Streak: ${d.streak}, Day ${d.daycount}. Earned ${d.gainedXP} XP and ${d.gainCoin} coins.`,

  [Events.MISSION_COMPLETED]: (d) =>
    `Completed mission "${d.missionTitle}". Full duration achieved!`,

  [Events.MISSION_JOINED]: (d) =>
    `Joined mission "${d.missionTitle}".`,

  [Events.EQUIPMENT_PURCHASED]: (d) => {
    const bonuses = Object.entries(d.appliedBonuses || {})
      .map(([stat, val]) => `${stat} +${val} levels`)
      .join(', ');
    return `Purchased "${d.equipmentName}" for ${d.cost} coins.${bonuses ? ` Gained: ${bonuses}.` : ''}`;
  },

  [Events.SKILL_UNLOCKED]: (d) =>
    `Unlocked skill "${d.skillName}".`,

  [Events.RANK_ASCENDED]: (d) =>
    `Ascended to rank ${d.newRank}! Reward: ${d.reward?.xp || 0} XP, ${d.reward?.coins || 0} coins.`,

  [Events.PENALTY_APPLIED]: (d) =>
    `Penalty applied (${d.penaltyType || 'streak break'}). Lost ${d.statPenalty} stat XP and ${d.coinPenalty} coins.`,

  [Events.SIDEQUEST_COMPLETED]: (d) =>
    `Completed sidequest "${d.title}" (${d.evaluated?.difficulty}). Stat: ${d.evaluated?.stat}.`,

  [Events.SIDEQUEST_CREATED]: (d) =>
    `Created sidequest "${d.title}" (${d.evaluated?.difficulty}, ${d.evaluated?.stat}).`,

  [Events.TITLE_UNLOCKED]: (d) =>
    `Earned title "${d.titleName}".`,
};

// ── Register listeners ───────────────────────────────

for (const [event, buildSummary] of Object.entries(summaries)) {
  eventBus.on(event, async (payload) => {
    try {
      const doc = await EventLog.create({
        userId: payload.userId,
        type: event,
        data: payload,
        summary: buildSummary(payload),
      });

      // 1. Redis PUBLISH → RAG-Service Python consumer (page building)
      if (redisClient) {
        redisClient.publish(RAG_CHANNEL, JSON.stringify({
          userId: payload.userId.toString(),
          type: event,
        })).catch(err => console.error('[EventLogger] Redis publish failed:', err.message));
      }

      // 2. BullMQ enqueue → Notification Worker (Socket.io push)
      enqueue({ userId: payload.userId, type: event, summary: doc.summary, data: payload, eventLogId: doc._id });
    } catch (err) {
      console.error(`[EventLogger] Failed to log "${event}":`, err.message);
    }
  });
}

console.log('[EventLogger] Registered listeners for', Object.keys(summaries).length, 'event types');

