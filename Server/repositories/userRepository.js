/**
 * UserRepository — data-access wrapper for the User model.
 * All Mongoose queries for User live here.
 */
import { User } from '../Models/user.js';

export const userRepo = {
  findById: (id, opts = {}) =>
    opts.session ? User.findById(id).session(opts.session) : User.findById(id),

  findByEmail: (email) => User.findOne({ email }),

  findByIdLean: (id) => User.findById(id).lean(),

  save: (user, opts = {}) =>
    opts.session ? user.save({ session: opts.session }) : user.save(),

  create: (data) => User.create(data),

  updateOne: (filter, update) => User.updateOne(filter, update),
};
