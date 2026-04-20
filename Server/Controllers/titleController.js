/**
 * TitleController — HTTP layer for title operations.
 * Uses repositories for data access and handleServiceError for errors.
 */
import { Title } from '../Models/title.js';
import { userRepo } from '../repositories/userRepository.js';
import { trackerRepo } from '../repositories/trackerRepository.js';
import { ServiceError, handleServiceError } from '../utils/serviceError.js';
import eventBus, { Events } from '../events/eventBus.js';

// ── Requirement evaluation (pure function) ───────────
function meetsRequirements(user, title) {
  if (!title.requirements || title.requirements.length === 0) return true;
  return title.requirements.every(r => {
    switch (r.type) {
      case 'level': return user.level >= r.value;
      case 'missionsCompleted': return (user.completed_trackers?.length || 0) >= r.value;
      case 'streak':
        return Array.isArray(user.trackersData) && user.trackersData.some(t => (t.streak || 0) >= r.value);
      case 'coins': return user.coins >= r.value;
      case 'statTotal':
        if (r.stat) return (user.stats?.[r.stat]?.value || 0) >= r.value;
        return Object.values(user.stats || {}).reduce((a, s) => a + (s?.value || 0), 0) >= r.value;
      case 'statLevel':
        if (!r.stat) return false;
        return (user.stats?.[r.stat]?.level || 1) >= r.value;
      case 'rank': {
        const order = ['E', 'D', 'C', 'B', 'A', 'S'];
        return order.indexOf(user.rank) >= order.indexOf(r.value);
      }
      default: return false;
    }
  });
}

// ── Controllers ──────────────────────────────────────

export const listTitles = async (req, res) => {
  try {
    const titles = await Title.find({ hidden: false }).sort({ tier: 1 });
    const user = await userRepo.findByIdLean(req.user.id);
    const trackerDocs = await trackerRepo.findByUserId(req.user.id, 'streak');
    user.trackersData = trackerDocs;

    const unlocked = new Set(user.titles || []);
    const enriched = titles.map(t => ({
      id: t._id,
      name: t.name,
      tier: t.tier,
      group: t.group,
      flavor: t.flavor,
      icon: t.icon,
      requirements: t.requirements,
      unlocked: unlocked.has(t.name) || meetsRequirements(user, t),
    }));

    return res.json({ titles: enriched });
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const unlockEligibleTitles = async (req, res) => {
  try {
    const user = await userRepo.findById(req.user.id);
    if (!user) throw new ServiceError('User not found', 404);

    const titles = await Title.find({});
    const added = [];
    for (const t of titles) {
      if (!user.titles.includes(t.name) && meetsRequirements(user, t)) {
        user.titles.push(t.name);
        added.push(t.name);
      }
    }

    if (added.length > 0) {
      await userRepo.save(user);
      for (const titleName of added) {
        eventBus.emitAsync(Events.TITLE_UNLOCKED, { userId: req.user.id, titleName });
      }
    }

    return res.json({ unlocked: added, titles: user.titles });
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const equipTitle = async (req, res) => {
  try {
    const { name } = req.body;
    const user = await userRepo.findById(req.user.id);
    if (!user) throw new ServiceError('User not found', 404);
    if (!user.titles.includes(name)) throw new ServiceError('Title not unlocked', 400);

    user.titles = [name, ...user.titles.filter(t => t !== name)];
    user.activeTitle = name;
    await userRepo.save(user);

    return res.json({ activeTitle: name, titles: user.titles });
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const seedDefaultTitles = async (req, res) => {
  const defaults = [
    { name: 'Novice Hunter', tier: 1, flavor: 'Just starting the path.', requirements: [{ type: 'level', value: 1 }] },
    { name: 'Apprentice of Shadows', tier: 1, flavor: 'Completed 3 missions.', requirements: [{ type: 'missionsCompleted', value: 3 }] },
    { name: 'Iron Challenger', tier: 2, flavor: 'Reach level 5.', requirements: [{ type: 'level', value: 5 }] },
    { name: 'Streak Adept', tier: 2, flavor: 'Maintain a 5 day streak.', requirements: [{ type: 'streak', value: 5 }] },
    { name: 'Coin Hoarder', tier: 2, flavor: 'Accumulate 200 coins.', requirements: [{ type: 'coins', value: 200 }] },
    { name: 'Stat Specialist (Strength)', tier: 3, flavor: 'Reach Strength level 10.', requirements: [{ type: 'statLevel', stat: 'strength', value: 10 }] },
    { name: 'Rising Monarch', tier: 3, flavor: 'Reach rank C.', requirements: [{ type: 'rank', value: 'C' }] },
    { name: 'Shadow Strategist', tier: 3, flavor: 'Total INT stat value 500.', requirements: [{ type: 'statTotal', stat: 'intelligence', value: 500 }] },
    { name: 'Relentless', tier: 4, flavor: 'Complete 15 missions.', requirements: [{ type: 'missionsCompleted', value: 15 }] },
    { name: 'Arcane Ascendant', tier: 4, flavor: 'Reach level 20.', requirements: [{ type: 'level', value: 20 }] },
    { name: 'Unbroken Chain', tier: 4, flavor: 'Maintain a 20 day streak.', requirements: [{ type: 'streak', value: 20 }] },
    { name: 'Shadow Monarch', tier: 5, flavor: 'Rank A and Level 35.', requirements: [{ type: 'rank', value: 'A' }, { type: 'level', value: 35 }] },
  ];

  try {
    const count = await Title.countDocuments();
    if (count === 0) await Title.insertMany(defaults);
    return res.json({ seeded: true, count: await Title.countDocuments() });
  } catch (err) {
    return handleServiceError(res, err);
  }
};