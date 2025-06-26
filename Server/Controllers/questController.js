import { Tracker } from "../Models/tracker.js";
import { User } from "../Models/user.js";
import mongoose from "mongoose";
import { upgradeQuests } from "../libs/adaptiveQuest.js";
import { statLevelThresholds, userLevelThresholds } from "../libs/levelling.js";

// export const statLevelThresholds = {
//   1: 10,
//   2: 25,
//   3: 45,
//   4: 70,
//   5: 100,
// };

// export const userLevelThresholds = {
//   1: 40,
//   2: 100,
//   3: 200,
//   4: 400,
// };

export const completeQuest = async (req, res) => {
  const { questId, trackerid, statAffected, xp } = req.body;
  const userId = req.user.id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find tracker and validate quest
    const tracker = await Tracker.findById(trackerid).session(session);
    if (!tracker) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Tracker not found" });
    }

    const questIndex = tracker.remainingQuests.findIndex(
      (q) => q.toString() === questId
    );
    if (questIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Quest not found in remainingQuests" });
    }

    // 2. Remove quest from remainingQuests
    tracker.remainingQuests.splice(questIndex, 1);

    // 3. Track completedQuests (optional analytics)
   tracker.questCompletion = tracker.questCompletion || {};
tracker.questCompletion[new Date().toISOString()] = [new mongoose.Types.ObjectId(questId)];


    // 4. Update user stat
    const user = await User.findById(userId).session(session);
    const stat = statAffected;
    user.stats[stat].value += xp;

    // 5. Stat level-up (multi-level support)
    while (
      statLevelThresholds[user.stats[stat].level] &&
      user.stats[stat].value >= statLevelThresholds[user.stats[stat].level]
    ) {
      user.stats[stat].value -= statLevelThresholds[user.stats[stat].level];
      user.stats[stat].level += 1;
    }

    // 6. Check if all daily quests are completed
    const dailyCompleted = tracker.remainingQuests.length === 0;
    let missionCompleted = false;

    if (dailyCompleted) {
      tracker.streak += 1;
      tracker.daycount += 1;
      tracker.lastCompleted = new Date();

      const rewardXP = tracker.reward?.xp || 0;
      const gainedXP = tracker.daycount >= tracker.duration
        ? rewardXP
        : Math.floor(rewardXP / 4);
      const rewardCoin=tracker.reward?.coins || 0;
     const gainCoin=tracker.daycount >= tracker.duration
        ? rewardCoin
        : Math.floor(rewardCoin / 4);

      user.xp += gainedXP;
     user.coins+=gainCoin;
      // 7. User level-up (multi-level support)
      while (
        userLevelThresholds[user.level] &&
        user.xp >= userLevelThresholds[user.level]
      ) {
        user.xp -= userLevelThresholds[user.level];
        user.level += 1;
      }

      // 8. Mark mission as completed
      if (tracker.daycount >= tracker.duration) {
        missionCompleted = true;
        user.completed_trackers.push(trackerid);
        // Optionally update user.achievements, titles, coins, etc.
      }
    }

    // 9. Save everything
    await tracker.save({ session });
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

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
    await session.abortTransaction();
    session.endSession();
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