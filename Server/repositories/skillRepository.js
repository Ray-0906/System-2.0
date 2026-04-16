/**
 * SkillRepository — data-access wrapper for the Skill model.
 */
import { Skill } from '../Models/skill.js';

export const skillRepo = {
  findById: (id) => Skill.findById(id),

  findByIds: (ids) => Skill.find({ _id: { $in: ids } }),

  findAll: (filter = {}) => Skill.find(filter),
};
