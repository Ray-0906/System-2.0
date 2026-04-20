/**
 * QuestService — quest completion business logic.
 * Extracted from questController.js for clean separation.
 */
import mongoose from 'mongoose';
import { ServiceError } from '../utils/serviceError.js';
import { trackerRepo } from '../repositories/trackerRepository.js';
import { questRepo } from '../repositories/questRepository.js';
import { userRepo } from '../repositories/userRepository.js';
import { recalcUserLevel } from './levelService.js';
import { applyMissionReward, applyStatGain } from './rewardService.js';
import { clearTemporaryCoinPenalty } from './multiplierService.js';
import { upgradeQuests } from '../libs/adaptiveQuest.js';
import eventBus, { Events } from '../events/eventBus.js';

/**
 * Complete a quest within a tracker.
 * @param {string} userId
 * @param {string} questId
 * @param {string} trackerId
 * @returns {object} completion result
 */
export const completeQuest = async (userId, questId, trackerId) => {
  const useTxn = process.env.MONGO_USE_TRANSACTIONS === 'true';
  const session = useTxn ? await mongoose.startSession() : null;
  if (session && useTxn) session.startTransaction();

  try {
    // 1. Atomic quest removal
    const tracker = await trackerRepo.pullQuest(trackerId, userId, questId, { session });
    if (!tracker) {
      if (session && useTxn) { await session.abortTransaction(); session.endSession(); }
      throw new ServiceError('Quest not found or already completed', 400);
    }

    // 2. Server-side quest data
    const questData = await questRepo.findById(questId);
    const statAffected = questData?.statAffected || 'strength';
    const xp = questData?.xp || 0;

    // 3. Track completion analytics
    if (!tracker.questCompletion) tracker.questCompletion = new Map();
    const dayKey = new Date().toISOString().split('T')[0];
    const prev = tracker.questCompletion.get(dayKey) || [];
    tracker.questCompletion.set(dayKey, [...prev, new mongoose.Types.ObjectId(questId)]);

    // 4. Apply stat gain with multipliers
    const user = await userRepo.findById(userId, { session });
    const appliedStatXP = await applyStatGain(user, statAffected, xp);

    // 5. Check daily completion
    const dailyCompleted = tracker.remainingQuests.length === 0;
    let missionCompleted = false;

    if (dailyCompleted) {
      tracker.streak += 1;
      tracker.daycount += 1;
      tracker.lastCompleted = new Date();
      const dayISO = tracker.lastCompleted.toISOString().split('T')[0];
      if (!tracker.completedDays) tracker.completedDays = [];
      if (!tracker.completedDays.includes(dayISO)) tracker.completedDays.push(dayISO);
      if (tracker.streak === 1) tracker.lastStreakReset = tracker.lastCompleted;

      // Regain streak-break coin multiplier penalty on first fully completed daily cycle.
      await clearTemporaryCoinPenalty(userId);

      const { gainedXP, gainedCoins } = await applyMissionReward(user, tracker);

      // Emit daily completed event
      eventBus.emitAsync(Events.DAILY_COMPLETED, {
        userId, trackerId, streak: tracker.streak, daycount: tracker.daycount,
        gainedXP, gainCoin: gainedCoins,
      });

      // Mission completed?
      if (tracker.daycount >= tracker.duration) {
        missionCompleted = true;
        user.completed_trackers.push(trackerId);
        user.trackers = user.trackers.filter(t => t.toString() !== trackerId.toString());

        eventBus.emitAsync(Events.MISSION_COMPLETED, {
          userId, trackerId, missionTitle: tracker.title,
        });
      }
    }

    // 6. Save
    await trackerRepo.save(tracker, { session });
    await userRepo.save(user, { session });

    if (session && useTxn) { await session.commitTransaction(); session.endSession(); }

    // Emit quest completed event
    eventBus.emitAsync(Events.QUEST_COMPLETED, {
      userId, questId, stat: statAffected, xp: appliedStatXP, streak: tracker.streak,
    });

    return {
      message: 'Quest completed',
      questId,
      statUpdated: {
        stat: statAffected,
        value: user.stats[statAffected].value,
        level: user.stats[statAffected].level,
      },
      xp: user.xp,
      coins: user.coins,
      userLevel: user.level,
      streak: tracker.streak,
      missionCompleted,
    };
  } catch (err) {
    if (session && useTxn) { await session.abortTransaction(); session.endSession(); }
    if (err instanceof ServiceError) throw err;
    console.error('Quest Completion Error:', err);
    throw new ServiceError('Server error completing quest', 500);
  }
};

/**
 * Upgrade quests in a tracker.
 * @param {string} userId
 * @param {string} trackerId
 * @returns {object} updated tracker
 */
export const upgradeTrackerQuests = async (userId, trackerId) => {
  const { updatedTracker } = await upgradeQuests(userId, trackerId);
  if (!updatedTracker) throw new ServiceError('Tracker not found', 404);
  return { message: 'Quests upgraded successfully', updatedTracker };
};
