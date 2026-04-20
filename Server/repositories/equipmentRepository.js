/**
 * EquipmentRepository — data-access wrapper for the Equiment model.
 */
import { Equiment } from '../Models/inventory.js';

export const equipmentRepo = {
  findById: (id) => Equiment.findById(id),

  findByIds: (ids) => Equiment.find({ _id: { $in: ids } }),

  findAll: (filter = {}) => Equiment.find(filter),
};
