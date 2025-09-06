// controllers/trackerController.js
// - createTrackerForMission
// - updateQuestCompletion
// - applyPenalties
// - checkAndApplyRewards
// - upgradeQuestInTracker

import { userLevelThresholds } from "../libs/levelling.js";
import { Mission } from "../Models/mission.js";
import { Tracker } from "../Models/tracker.js";
import { User } from "../Models/user.js";
import mongoose from 'mongoose';

import { Quest } from '../Models/quest.js'; // Adjust path as needed

// import { userLevelThresholds } from "./questController.js";

/**
 * Creates a tracker for a given user and mission.
 * @param {string} userId - The user's ObjectId as a string.
 * @param {object} mission - The mission document (must be saved before).
 * @returns {object} - The saved tracker document.
 */

export const createTrackerForUser = async (userId, mission) => {
  try {
    const existing = await Tracker.findOne({ userId, missionId: mission._id });
    if (existing) {
      throw new Error("Tracker already exists for this mission.");
    }

    const questIds = mission.quests; // as quests:[quests_ids]
    const today = new Date().toISOString().split("T")[0];

    const questCompletion = new Map();
    questCompletion.set(today, []); // Start with no completed quests for today

    const tracker = new Tracker({
      userId,
      missionId: mission._id,
      currentQuests: questIds,
      remainingQuests: questIds,
      questCompletion,
      streak: 0,
      daycount: 0,
      lastCompleted: new Date(), // No quests completed yet
      lastUpdated: new Date(),
      penaltiesApplied: [],
      rewardsClaimed: false,
  completedDays: [],

      // Flattened mission fields
      title: mission.title,
  description: mission.description,
      duration: mission.duration,
      reward: mission.reward,
      penalty: mission.penalty,
      rank: mission.rank,
    });

    await tracker.save();

    // Update user's active missions
    const user = await User.findById(userId);
    if (user && !user.current_missions.includes(mission._id)) {
      user.current_missions.push(mission._id);
      user.trackers.push(tracker._id);
      user.totalMission+=1;
      await user.save();
    }

    // Add user to mission's participant list
    if (!mission.participants.includes(userId)) {
      mission.participants.push(userId);
      await mission.save();
    }

    return tracker;
  } catch (err) {
    console.error("Error creating tracker:", err.message);
    throw new Error(`Tracker creation failed: ${err.message}`);
  }
};

export const joinMission = async (req, res) => {
  const { missionId } = req.body;
  const userId = req.user.id;

  try {
    const mission = await Mission.findById(missionId);
    if (!mission) {
      return res.status(404).json({ message: "Mission not found" });
    }

    const tracker = await createTrackerForUser(userId, mission);
    if (!tracker) {
      return res
        .status(400)
        .json({
          message: "Already joined this mission or tracker creation failed.",
        });
    }

    res.status(201).json({
      message: "Mission joined successfully",
      missionId: mission._id,
      tracker,
    });
  } catch (error) {
    console.error("Error joining mission:", error.message);
    res.status(500).json({ message: "Failed to join the mission." });
  }
};

export const dailyRefresh = async (req, res) => {
  const { trackerId, penaltyType } = req.body;
  const userId = req.user.id;
  console.log("Daily Refresh Request:", { trackerId, penaltyType });

  try {
    const tracker = await Tracker.findById(trackerId);
    if (!tracker) return res.status(404).json({ message: "Tracker not found" });

    let updatedStats = {};
    let deleted = false;
    if (penaltyType === "missionFail") {
      // Apply penalty first
      tracker.failed = true;
      const penalty = tracker.penalty.missionFail;
      updatedStats = await pentaltyEffects(
        penaltyType,
        trackerId,
        userId,
        penalty.stats,
        penalty.coins
      );
      // Auto delete mechanism: remove tracker entirely
      await Tracker.deleteOne({ _id: trackerId });
      // Remove tracker reference from user
      await User.updateOne({ _id: userId }, { $pull: { trackers: trackerId } });
      deleted = true;
      return res.status(200).json({
        message: "Tracker failed and deleted after inactivity.",
        updatedStats,
        deleted,
      });
    } else if (penaltyType === "skip") {
      tracker.penaltiesApplied.push(new Date());
      tracker.failed = false;
      const penalty = tracker.penalty.skip;
      updatedStats = await pentaltyEffects(
        penaltyType,
        trackerId,
        userId,
        penalty.stats,
        penalty.coins
      );
    }

    if (!deleted) {
      tracker.remainingQuests = tracker.currentQuests;
      tracker.lastUpdated = new Date();
      await tracker.save();
      return res.status(200).json({
        message: "Tracker refreshed successfully",
        updatedStats,
        deleted,
      });
    }
  } catch (err) {
    console.error("Daily Refresh Error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};


const pentaltyEffects = async (penaltyType, trackerId, userId, xp, coin) => {
  const user = await User.findById(userId);
  if (!user) {
    console.log("User Not found");
    return;
  }

  let lv = user.level;
  let ucoin = Math.max(0, user.coins - coin);
  let uxp = user.xp - xp;

  while (uxp < 0 && lv > 1) {
    lv--;
    uxp += userLevelThresholds[lv];
  }
  uxp = Math.max(0, uxp);

  if (penaltyType === "missionFail") {
    user.trackers.pull(trackerId);
  }

  user.level = lv;
  user.xp = uxp;
  user.coins = ucoin;

  await user.save();

  return {
    level: lv,
    xp: uxp,
    coins: ucoin,
  };
};



/**
 * @description Delete a mission (tracker) and all associated data.
 * @route DELETE /api/mission/:id
 * @access Private
 */
export const deleteMissionTracker = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // Assuming user ID is available from auth middleware

  // 1. Validate the Mission ID
  // ✅ FIX: Use the correct variable 'id' instead of the undefined 'missionId'
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid mission ID.' });
  }

  const useTxn = process.env.MONGO_USE_TRANSACTIONS === 'true';
  const session = useTxn ? await mongoose.startSession() : null;

  try {
    if (session && useTxn) session.startTransaction();

    // 2. Find the tracker, ensuring it belongs to the authenticated user
    // 🛡️ SECURITY: Added 'user: userId' to ensure the user owns this mission.
  const trackerQuery = Tracker.findOne({ _id: id, userId: userId });
  const tracker = session ? await trackerQuery.session(session) : await trackerQuery;

    if (!tracker) {
      await session.abortTransaction();
      session.endSession();
      // This message is intentionally generic for security.
      return res.status(404).json({ message: 'Mission not found.' });
    }

    // 3. Delete all associated quests from the Quest collection
    if (tracker.currentQuests && tracker.currentQuests.length > 0) {
      if (session) {
        await Quest.deleteMany({ _id: { $in: tracker.currentQuests } }).session(session);
      } else {
        await Quest.deleteMany({ _id: { $in: tracker.currentQuests } });
      }
    }
    
    // 4. Pull the tracker ID from the user's `trackers` array
    if (session) {
      await User.updateOne(
        { _id: userId },
        { $pull: { trackers: id } }
      ).session(session);
    } else {
      await User.updateOne(
        { _id: userId },
        { $pull: { trackers: id } }
      );
    }

    // 5. Delete the tracker document itself
    if (session) {
      await Tracker.deleteOne({ _id: id }).session(session);
    } else {
      await Tracker.deleteOne({ _id: id });
    }

    // 6. Commit the transaction
    if (session && useTxn) await session.commitTransaction();
    
    res.status(200).json({ message: 'Mission deleted successfully.' });

  } catch (error) {
    if (session && useTxn) await session.abortTransaction();
    console.error('Error deleting mission:', error);
    res.status(500).json({ message: 'Server error while deleting mission.' });

  } finally {
    if (session) session.endSession();
  }
};

/**
 * Abandon (give up) a mission tracker early with a coin fee.
 * Fee logic: If user has >=5 coins, deduct 5. Else deduct all remaining coins (0 left).
 * Removes tracker, associated quests, and reference from user just like delete.
 */
export const abandonMissionTracker = async (req, res) => {
  const { id } = req.params; // tracker id
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid mission ID.' });
  }

  try {
    const tracker = await Tracker.findOne({ _id: id, userId });
    if (!tracker) {
      return res.status(404).json({ message: 'Mission not found.' });
    }

    // Load user to apply abandon fee
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const originalCoins = user.coins || 0;
    const fee = originalCoins >= 5 ? 5 : originalCoins; // all coins if less than 5
    user.coins = originalCoins - fee;

    // Clean up quests and tracker similar to delete operation
    if (tracker.currentQuests && tracker.currentQuests.length > 0) {
      await Quest.deleteMany({ _id: { $in: tracker.currentQuests } });
    }
    await User.updateOne({ _id: userId }, { $pull: { trackers: id } });
    await Tracker.deleteOne({ _id: id });
    await user.save();

    return res.status(200).json({ message: 'Mission abandoned.', feeApplied: fee, remainingCoins: user.coins });
  } catch (error) {
    console.error('Error abandoning mission:', error);
    return res.status(500).json({ message: 'Server error abandoning mission.' });
  }
};