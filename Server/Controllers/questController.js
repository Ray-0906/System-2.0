import { Tracker } from "../Models/tracker.js";
import { Quest } from "../Models/quest.js";
import { User } from "../Models/user.js";
import mongoose from "mongoose";
import { upgradeQuests } from "../libs/adaptiveQuest.js";
import { recalcUserLevel } from "../services/levelService.js";
import { applyStatGain, applyMissionReward } from "../services/rewardService.js";


export const completeQuest = async (req, res) => {
  const { questId, trackerid } = req.body;
  const userId = req.user.id;
  const useTxn = process.env.MONGO_USE_TRANSACTIONS === 'true';
  const session = useTxn ? await mongoose.startSession() : null;
  if (session && useTxn) {
    session.startTransaction();
  }

  try {
    // 1. Atomic quest removal — prevents race conditions with rapid-fire requests
    const trackerQuery = {
      _id: trackerid,
      userId,
      remainingQuests: questId,
    };
    const trackerUpdate = { $pull: { remainingQuests: questId } };
    const tracker = session
      ? await Tracker.findOneAndUpdate(trackerQuery, trackerUpdate, { new: true, session })
      : await Tracker.findOneAndUpdate(trackerQuery, trackerUpdate, { new: true });
    if (!tracker) {
      if (session && useTxn) { await session.abortTransaction(); session.endSession(); }
      return res.status(400).json({ message: "Quest not found or already completed" });
    }

    // Server-side quest data lookup from DB
    const questData = await Quest.findById(questId);
    const statAffected = questData?.statAffected || 'strength';
    const xp = questData?.xp || 0;

    // 3. Track completedQuests (optional analytics) using Map API
    if (!tracker.questCompletion) {
      tracker.questCompletion = new Map();
    }
    const dayKey = new Date().toISOString().split('T')[0];
    const prev = tracker.questCompletion.get(dayKey) || [];
    tracker.questCompletion.set(dayKey, [...prev, new mongoose.Types.ObjectId(questId)]);


    // 4. Update user stat with equipment bonuses + skill multipliers
    const userQuery = User.findById(userId);
    const user = session ? await userQuery.session(session) : await userQuery;
    const stat = statAffected;
    await applyStatGain(user, stat, xp);

    // 6. Check if all daily quests are completed
    const dailyCompleted = tracker.remainingQuests.length === 0;
    let missionCompleted = false;

    if (dailyCompleted) {
      tracker.streak += 1;
      tracker.daycount += 1;
      tracker.lastCompleted = new Date();
      const dayISO = tracker.lastCompleted.toISOString().split('T')[0];
      if (!tracker.completedDays) tracker.completedDays = [];
      if (!tracker.completedDays.includes(dayISO)) tracker.completedDays.push(dayISO);
      // If this is the first day of a (new) streak, set/reset lastStreakReset
      if (tracker.streak === 1) {
        tracker.lastStreakReset = tracker.lastCompleted;
      }

      const rewardXP = tracker.reward?.xp || 0;
      const gainedXP = tracker.daycount >= tracker.duration
        ? rewardXP
        : Math.floor(rewardXP / 4);
      const rewardCoin=tracker.reward?.coins || 0;
     const gainCoin=tracker.daycount >= tracker.duration
        ? rewardCoin
        : Math.floor(rewardCoin / 3);

      user.xp += gainedXP;
     user.coins+=gainCoin;
      // 7. User level-up via shared service
      recalcUserLevel(user);

      // 8. Mark mission as completed + remove from active trackers
      if (tracker.daycount >= tracker.duration) {
        missionCompleted = true;
        user.completed_trackers.push(trackerid);
        user.trackers = user.trackers.filter(t => t.toString() !== trackerid.toString());
      }
    }

    // 9. Save everything
    if (session) {
      await tracker.save({ session });
      await user.save({ session });
    } else {
      await tracker.save();
      await user.save();
    }

    if (session && useTxn) {
      await session.commitTransaction();
      session.endSession();
    }

    return res.status(200).json({
      message: "Quest completed",
      questId,
      statUpdated: {
        stat,
        value: user.stats[stat].value,
        level: user.stats[stat].level,
      },
      xp: user.xp,
      coins:user.coins,
      userLevel: user.level,
      streak: tracker.streak,
      missionCompleted,
    });
    
  } catch (err) {
    if (session && useTxn) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Quest Completion Error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const upgradeTracker= async(req,res)=>{
const {trackerId} = req.body;
const userId = req.user.id;
  try {
    const  {updatedTracker}= await upgradeQuests(userId, trackerId);
    // console.log("Updated Tracker:", updatedTracker);
    if (!updatedTracker) {
      return res.status(404).json({ message: "Tracker not found" });
    }  
    return res.status(200).json({
      message: "Quests upgraded successfully",
      updatedTracker,
    });

  }catch (err) {  
    console.error("Upgrade Tracker Error:", err);
    return res.status(500).json({ message: "Failed to upgrade Quests" });
  }

}