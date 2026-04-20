/**
 * QuestRepository — data-access wrapper for the Quest model.
 */
import { Quest } from '../Models/quest.js';

export const questRepo = {
  findById: (id) => Quest.findById(id),

  findByIds: (ids) => Quest.find({ _id: { $in: ids } }),

  create: (data) => new Quest(data),

  createMany: (dataArray) =>
    Promise.all(dataArray.map(d => new Quest(d).save())),

  deleteByIds: (ids) => Quest.deleteMany({ _id: { $in: ids } }),
};
