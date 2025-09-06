import { Tracker } from "../Models/tracker.js";
import { User } from "../Models/user.js";
import { Mission } from "../Models/mission.js";
import GraphQLJSON from "graphql-type-json";
import { Quest } from "../Models/quest.js";
import { Skill } from "../Models/skill.js";
import { Equiment } from "../Models/inventory.js";
import { Sidequest } from "../Models/sidequests.js";
import { _test_evaluateSidequest as evaluateSidequest } from "../Controllers/sidequestController.js";
import { statLevelThresholds, userLevelThresholds } from '../libs/levelling.js';

export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
    getUser: async (_, __, context) => {
      const user = context?.user;
      if (!user) {
        throw new Error("Unauthorized");
      }
      return user;
    },
    getUserTrackers: async (_, __, { req }) => {
      const userId = req.user?.id;
      if (!userId) throw new Error("Unauthorized");
      return await Tracker.find({ userId });
    },
    getPublicMissions: async () => {
      return await Mission.find({ public: true });
    },
    getTrackerById: async (_, { id }, { user }) => {
      if (!user) throw new Error("Unauthorized");
      const tracker = await Tracker.findOne({ _id: id, userId: user._id });
      if (!tracker) throw new Error("Tracker not found");
      return tracker;
    },
    getAllSkills: async () => {
      return await Skill.find();
    },
    getSkillById: async (_, { id }) => {
      return await Skill.findById(id);
    },
    getAllEquipment: async () => {
      return await Equiment.find();
    },
    getEquipmentById: async (_, { id }) => {
      return await Equiment.findById(id);
    },
    leaderboard: async (_,{ limit = 20, sortBy = 'xp' }) => {
      const allowed = ['xp','level','coins','totalMission'];
      if(!allowed.includes(sortBy)) sortBy = 'xp';
      const lim = Math.min(Math.max(limit,1),100);
      const projection = 'username level xp coins rank totalMission titles';
      return await User.find({}, projection).sort({ [sortBy]: -1 }).limit(lim);
    },
    getSidequests: async (_,{ status }, { user }) => {
      if(!user) throw new Error('Unauthorized');
      const filter = { userId: user._id };
      if(status) filter.status = status;
      const list = await Sidequest.find(filter).sort({ createdAt: -1 });
      return list;
    }
  },
  Mutation: {
    createSidequest: async (_,{ input }, { user }) => {
      if(!user) throw new Error('Unauthorized');
      const { title, description, deadline, hintEffort } = input;
      const evaluated = await evaluateSidequest({ title, description, hintEffort });
      const doc = await Sidequest.create({ title, description, userId: user._id, deadline: deadline? new Date(deadline): null, evaluated });
      return doc;
    },
    completeSidequest: async (_,{ id }, { user }) => {
      if(!user) throw new Error('Unauthorized');
      const sq = await Sidequest.findOne({ _id: id, userId: user._id });
      if(!sq) throw new Error('Not found');
      if(sq.status !== 'completed') {
        sq.status='completed';
        sq.completedAt = new Date();
        await sq.save();
        // reward user
        const incMap = { trivial:0, easy:1, medium:2, hard:3 };
        user.xp = (user.xp||0) + sq.evaluated.xp;
        user.coins = (user.coins||0) + sq.evaluated.coins;
        if(user.stats && user.stats[sq.evaluated.stat]){
          user.stats[sq.evaluated.stat].value += (incMap[sq.evaluated.difficulty] ?? 1);
          // stat level ups
          while(true){
            const st = user.stats[sq.evaluated.stat];
            const next = st.level + 1;
            const need = statLevelThresholds[next];
            if(need && st.value >= need) st.level = next; else break;
          }
        }
        while(true){
          const next = user.level + 1;
          const need = userLevelThresholds[next];
          if(need && user.xp >= need) user.level = next; else break;
        }
        await user.save();
      }
      return sq; // client can refetch user to show updated stats
    },
    updateProfile: async (_,{ activeTitle, avatar }, { user }) => {
      if(!user) throw new Error('Unauthorized');
      const doc = await User.findById(user._id);
      if(activeTitle){
        if(!doc.titles.includes(activeTitle)) throw new Error('Title not unlocked');
        doc.activeTitle = activeTitle;
        // ensure ordering (active first)
        doc.titles = [activeTitle, ...doc.titles.filter(t=>t!==activeTitle)];
      }
      if(avatar){
        doc.avatar = avatar;
      }
      await doc.save();
      return doc;
    }
  },
  User: {
    trackers: async (parent) => {
      // parent.trackers is an array of ObjectId
      return await Tracker.find({ _id: { $in: parent.trackers } });
    },
    skills: async (parent) => {
      return await Skill.find({ _id: { $in: parent.skills } });
    },
    equiments: async (parent) => {
      // parent.equiments is an array of ObjectId
      return await Equiment.find({ _id: { $in: parent.equiments } });
    },
  },

  Tracker: {
    id: (parent) => parent._id.toString(), // expose Mongo _id as id
    currentQuests: async (parent) => {
      return await Quest.find({ _id: { $in: parent.currentQuests } });
    },
    remainingQuests: async (parent) => {
      return await Quest.find({ _id: { $in: parent.remainingQuests } });
    },
  lastStreakReset: (parent) => parent.lastStreakReset ? parent.lastStreakReset.toISOString() : null,
  completedDays: (parent) => (parent.completedDays || []).map(d => (d instanceof Date ? d.toISOString() : d)),
  },
  Mission: {
    id: (parent) => parent._id.toString(),
  },
  Sidequest: {
    id: (parent) => parent._id.toString(),
    deadline: (p) => p.deadline? p.deadline.toISOString(): null,
    createdAt: (p) => p.createdAt? p.createdAt.toISOString(): null,
    completedAt: (p) => p.completedAt? p.completedAt.toISOString(): null,
  }
};
