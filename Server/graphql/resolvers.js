import { Tracker } from "../Models/tracker.js";
import { User } from "../Models/user.js";
import { Mission } from "../Models/mission.js";
import GraphQLJSON from 'graphql-type-json';
import { Quest } from "../Models/quest.js";
export const resolvers = {
  JSON: GraphQLJSON,
  Query: {
   getUser: async (_, __, context) => {
  const user = context?.user;
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
,
    getUserTrackers: async (_, __, { req }) => {
      const userId = req.user?.id;
      if (!userId) throw new Error('Unauthorized');
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
  },
  User: {
    trackers: async (parent) => {
      // parent.trackers is an array of ObjectId
      return await Tracker.find({ _id: { $in: parent.trackers } });
    }
  },
  Tracker: {
    id: (parent) => parent._id.toString(), // expose Mongo _id as id
     currentQuests: async (parent) => {
      return await Quest.find({ _id: { $in: parent.currentQuests } });
    },
    remainingQuests: async (parent) => {
      return await Quest.find({ _id: { $in: parent.remainingQuests } });
    },
  },
  Mission: {
    id: (parent) => parent._id.toString(),
  },
};
