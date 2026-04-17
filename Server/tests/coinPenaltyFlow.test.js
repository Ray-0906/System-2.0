import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  findOne,
  findOneAndUpdate,
  create,
  findEquipment,
  findSkills,
} = vi.hoisted(() => ({
  findOne: vi.fn(),
  findOneAndUpdate: vi.fn(),
  create: vi.fn(),
  findEquipment: vi.fn(),
  findSkills: vi.fn(),
}));

vi.mock('../Models/userState.js', () => ({
  UserState: {
    findOne,
    findOneAndUpdate,
    create,
  },
}));

vi.mock('../Models/inventory.js', () => ({
  Equiment: {
    find: findEquipment,
  },
}));

vi.mock('../Models/skill.js', () => ({
  Skill: {
    find: findSkills,
  },
}));

import { applyMissionReward } from '../services/rewardService.js';
import {
  applyTemporaryCoinPenalty,
  clearTemporaryCoinPenalty,
} from '../services/multiplierService.js';

describe('coin penalty flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findEquipment.mockResolvedValue([]);
    findSkills.mockResolvedValue([]);
  });

  it('applies -5% coins after streak break and restores on next completed daily', async () => {
    const state = {
      multipliers: {
        strength: 1,
        intelligence: 1,
        agility: 1,
        endurance: 1,
        charisma: 1,
        coins: 1.0,
      },
      temporary: {
        coinPenaltyActive: false,
      },
      save: vi.fn(),
    };

    findOne.mockImplementation(async () => state);

    const user = {
      _id: 'user-1',
      xp: 0,
      coins: 0,
      level: 1,
    };

    const tracker = {
      reward: { xp: 0, coins: 100 },
      daycount: 1,
      duration: 1,
    };

    await applyTemporaryCoinPenalty('user-1');
    expect(state.temporary.coinPenaltyActive).toBe(true);
    expect(state.multipliers.coins).toBe(0.95);

    const penalizedReward = await applyMissionReward(user, tracker);
    expect(penalizedReward.gainedCoins).toBe(95);

    await clearTemporaryCoinPenalty('user-1');
    expect(state.temporary.coinPenaltyActive).toBe(false);
    expect(state.multipliers.coins).toBe(1.0);

    const recoveredReward = await applyMissionReward(user, tracker);
    expect(recoveredReward.gainedCoins).toBe(100);
  });
});
