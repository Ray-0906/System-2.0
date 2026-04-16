/**
 * TrackerRepository — data-access wrapper for the Tracker model.
 */
import { Tracker } from '../Models/tracker.js';

export const trackerRepo = {
  findById: (id, opts = {}) =>
    opts.session ? Tracker.findById(id).session(opts.session) : Tracker.findById(id),

  findByUserId: (userId, projection) =>
    Tracker.find({ userId }, projection),

  findByUserAndMission: (userId, missionId) =>
    Tracker.findOne({ userId, missionId }),

  pullQuest: (trackerId, userId, questId, opts = {}) => {
    const query = { _id: trackerId, userId, remainingQuests: questId };
    const update = { $pull: { remainingQuests: questId } };
    return opts.session
      ? Tracker.findOneAndUpdate(query, update, { new: true, session: opts.session })
      : Tracker.findOneAndUpdate(query, update, { new: true });
  },

  save: (tracker, opts = {}) =>
    opts.session ? tracker.save({ session: opts.session }) : tracker.save(),

  create: (data) => new Tracker(data),

  deleteById: (id) => Tracker.findByIdAndDelete(id),
};
