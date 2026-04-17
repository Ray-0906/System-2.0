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

import {
  applyTemporaryCoinPenalty,
  clearTemporaryCoinPenalty,
  recalcMultipliers,
} from '../services/multiplierService.js';

describe('multiplierService temporary coin penalty', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findEquipment.mockResolvedValue([]);
    findSkills.mockResolvedValue([]);
  });

  it('applies -5% coin multiplier once', async () => {
    const save = vi.fn();
    const state = {
      multipliers: { strength: 1, intelligence: 1, agility: 1, endurance: 1, charisma: 1, coins: 1.0 },
      temporary: { coinPenaltyActive: false },
      save,
    };

    findOne.mockResolvedValue(state);

    const result = await applyTemporaryCoinPenalty('user-1');

    expect(result.coins).toBe(0.95);
    expect(state.temporary.coinPenaltyActive).toBe(true);
    expect(save).toHaveBeenCalled();

    findOne.mockResolvedValue(state);
    const second = await applyTemporaryCoinPenalty('user-1');
    expect(second.coins).toBe(0.95);
  });

  it('clears active penalty on next daily completion', async () => {
    const save = vi.fn();
    const state = {
      multipliers: { strength: 1, intelligence: 1, agility: 1, endurance: 1, charisma: 1, coins: 0.95 },
      temporary: { coinPenaltyActive: true },
      save,
    };

    findOne.mockResolvedValue(state);

    const result = await clearTemporaryCoinPenalty('user-1');

    expect(result.coins).toBe(1.0);
    expect(state.temporary.coinPenaltyActive).toBe(false);
    expect(save).toHaveBeenCalled();
  });

  it('preserves active penalty during multiplier recalculation', async () => {
    findOne.mockResolvedValue({ temporary: { coinPenaltyActive: true } });
    findOneAndUpdate.mockResolvedValue({
      multipliers: {
        strength: 1,
        intelligence: 1,
        agility: 1,
        endurance: 1,
        charisma: 1,
        coins: 0.95,
      },
    });

    const result = await recalcMultipliers('user-1', [], []);

    expect(result.coins).toBe(0.95);
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { userId: 'user-1' },
      expect.objectContaining({
        temporary: { coinPenaltyActive: true },
      }),
      { upsert: true, new: true }
    );
  });
});
