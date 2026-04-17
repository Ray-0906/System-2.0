/**
 * TrackerService — tracker creation, daily refresh, deletion, and abandonment.
 * Extracted from trackerController.js for clean separation.
 */
import mongoose from 'mongoose';
import { ServiceError } from '../utils/serviceError.js';
import { trackerRepo } from '../repositories/trackerRepository.js';
import { questRepo } from '../repositories/questRepository.js';
import { userRepo } from '../repositories/userRepository.js';
import { missionRepo } from '../repositories/missionRepository.js';
import { userLevelThresholds } from '../libs/levelling.js';
import eventBus, { Events } from '../events/eventBus.js';
import { applyTemporaryCoinPenalty } from './multiplierService.js';

/**
 * Create a tracker when a user joins a mission.
 */
export const createTrackerForUser = async (userId, mission) => {
  const existing = await trackerRepo.findByUserAndMission(userId, mission._id);
  if (existing) throw new ServiceError('Tracker already exists for this mission.', 409);

  const questIds = mission.quests;
  const today = new Date().toISOString().split('T')[0];
  const questCompletion = new Map();
  questCompletion.set(today, []);

  const tracker = trackerRepo.create({
    userId,
    missionId: mission._id,
    currentQuests: questIds,
    remainingQuests: questIds,
    questCompletion,
    streak: 0,
    daycount: 0,
    lastCompleted: new Date(),
    lastUpdated: new Date(),
    penaltiesApplied: [],
    rewardsClaimed: false,
    completedDays: [],
    title: mission.title,
    description: mission.description,
    duration: mission.duration,
    reward: mission.reward,
    penalty: mission.penalty,
    rank: mission.rank,
  });

  await trackerRepo.save(tracker);

  // Update user
  const user = await userRepo.findById(userId);
  if (user && !user.current_missions.includes(mission._id)) {
    user.current_missions.push(mission._id);
    user.trackers.push(tracker._id);
    user.totalMission += 1;
    await userRepo.save(user);
  }

  // Add user to mission participants
  if (!mission.participants.includes(userId)) {
    mission.participants.push(userId);
    await missionRepo.save(mission);
  }

  eventBus.emitAsync(Events.MISSION_JOINED, {
    userId,
    missionId: mission._id.toString(),
    missionTitle: mission.title,
  });

  return tracker;
};

/**
 * Join a mission by ID.
 */
export const joinMission = async (userId, missionId) => {
  const mission = await missionRepo.findById(missionId);
  if (!mission) throw new ServiceError('Mission not found', 404);

  const tracker = await createTrackerForUser(userId, mission);
  return {
    message: 'Joined mission successfully',
    tracker,
    mission: {
      _id: mission._id,
      title: mission.title,
      description: mission.description,
    },
  };
};

/**
 * Daily refresh — check if quests need resetting for a new day.
 */
export const dailyRefresh = async (userId, trackerId, penaltyType) => {
  const tracker = await trackerRepo.findById(trackerId);
  if (!tracker) throw new ServiceError('Tracker not found', 404);
  if (tracker.userId.toString() !== userId.toString()) {
    throw new ServiceError('Unauthorized', 403);
  }

  const now = new Date();
  const lastUpdated = tracker.lastUpdated ? new Date(tracker.lastUpdated) : null;

  // Same day — no refresh needed
  if (lastUpdated && now.toDateString() === lastUpdated.toDateString()) {
    return { refreshed: false, tracker };
  }

  // Reset remaining quests to full set
  tracker.remainingQuests = [...tracker.currentQuests];
  tracker.lastUpdated = now;

  // Apply penalty if streak was broken
  if (penaltyType && tracker.streak > 0) {
    const penaltyByType = tracker.penalty?.[penaltyType];
    const legacyPenalty = tracker.penalty;
    if (penaltyByType || legacyPenalty) {
      const user = await userRepo.findById(userId);
      if (user) {
        // Support both current nested penalty shape and legacy flat shape.
        const statPenalty = penaltyByType?.stats ?? legacyPenalty?.stats ?? legacyPenalty?.xp ?? 0;
        const configuredCoinPenalty = penaltyByType?.coins ?? legacyPenalty?.coins ?? 0;
        const coinPenalty = Math.min(configuredCoinPenalty, user.coins || 0);

        // Apply penalties
        if (statPenalty > 0) {
          const stats = Object.keys(user.stats);
          for (const stat of stats) {
            if (user.stats[stat]) {
              user.stats[stat].value = Math.max(0, user.stats[stat].value - statPenalty);
            }
          }
        }
        if (coinPenalty > 0) {
          user.coins = Math.max(0, user.coins - coinPenalty);
        }

        // Apply temporary -5% coin multiplier only for streak-break (skip) penalties.
        if (penaltyType === 'skip') {
          await applyTemporaryCoinPenalty(userId);
        }

        await userRepo.save(user);

        eventBus.emitAsync(Events.PENALTY_APPLIED, {
          userId, trackerId, penaltyType, statPenalty, coinPenalty,
        });
      }
    }
    tracker.streak = 0;
  }

  await trackerRepo.save(tracker);
  return { refreshed: true, tracker };
};

/**
 * Delete a mission tracker and clean up all references.
 */
export const deleteTracker = async (userId, trackerId) => {
  const tracker = await trackerRepo.findById(trackerId);
  if (!tracker) throw new ServiceError('Tracker not found', 404);
  if (tracker.userId.toString() !== userId.toString()) {
    throw new ServiceError('Not authorized', 403);
  }

  // Remove quests
  await questRepo.deleteByIds(tracker.currentQuests || []);

  // Clean up user references
  const user = await userRepo.findById(userId);
  if (user) {
    user.trackers = user.trackers.filter(t => t.toString() !== trackerId);
    user.current_missions = user.current_missions.filter(
      m => m.toString() !== tracker.missionId?.toString()
    );
    await userRepo.save(user);
  }

  await trackerRepo.deleteById(trackerId);
  return { message: 'Mission tracker deleted successfully' };
};

/**
 * Abandon a mission tracker (with coin fee).
 */
export const abandonTracker = async (userId, trackerId) => {
  const tracker = await trackerRepo.findById(trackerId);
  if (!tracker) throw new ServiceError('Tracker not found', 404);
  if (tracker.userId.toString() !== userId.toString()) {
    throw new ServiceError('Not authorized', 403);
  }

  // Deduct abandonment fee
  const user = await userRepo.findById(userId);
  let coinsDeducted = 0;
  if (user) {
    const fee = Math.min(5, user.coins);
    coinsDeducted = fee;
    user.coins -= fee;
    user.trackers = user.trackers.filter(t => t.toString() !== trackerId);
    user.current_missions = user.current_missions.filter(
      m => m.toString() !== tracker.missionId?.toString()
    );
    await userRepo.save(user);
  }

  await questRepo.deleteByIds(tracker.currentQuests || []);
  await trackerRepo.deleteById(trackerId);

  return { message: 'Mission abandoned', coinsDeducted };
};
