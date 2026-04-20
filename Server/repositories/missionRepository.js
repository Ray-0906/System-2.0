/**
 * MissionRepository — data-access wrapper for the Mission model.
 */
import { Mission } from '../Models/mission.js';

export const missionRepo = {
  findById: (id) => Mission.findById(id),

  findAll: (filter = {}) => Mission.find(filter),

  create: (data) => new Mission(data),

  save: (mission) => mission.save(),

  deleteById: (id) => Mission.findByIdAndDelete(id),
};
