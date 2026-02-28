import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the User model and levelling thresholds
vi.mock('../Models/user.js', () => ({
  User: {
    findById: vi.fn(),
  },
}));

vi.mock('../libs/levelling.js', () => ({
  userLevelThresholds: {
    1: 40,
    2: 51,
    3: 64,
    4: 80,
    5: 100,
  },
}));

import { applyPenalty } from '../services/penaltyService.js';
import { User } from '../Models/user.js';

describe('applyPenalty', () => {
  let mockUser;

  beforeEach(() => {
    mockUser = {
      level: 3,
      xp: 30,
      coins: 100,
      trackers: {
        pull: vi.fn(),
      },
      save: vi.fn(),
    };
    User.findById.mockResolvedValue(mockUser);
  });

  it('should deduct coins correctly', async () => {
    const result = await applyPenalty('skip', 'tracker1', 'user1', 0, 50);
    expect(result.coins).toBe(50);
  });

  it('should clamp coins to 0', async () => {
    mockUser.coins = 30;
    const result = await applyPenalty('skip', 'tracker1', 'user1', 0, 100);
    expect(result.coins).toBe(0);
  });

  it('should deduct XP without de-leveling', async () => {
    mockUser.xp = 50;
    const result = await applyPenalty('skip', 'tracker1', 'user1', 20, 0);
    expect(result.xp).toBe(30);
    expect(result.level).toBe(3);
  });

  it('should de-level when XP goes negative', async () => {
    mockUser.xp = 10;
    mockUser.level = 3;
    // Deduct 50 XP: 10 - 50 = -40, then add threshold[3]=64, so xp = 24, lv = 2
    const result = await applyPenalty('skip', 'tracker1', 'user1', 50, 0);
    expect(result.level).toBe(2);
    expect(result.xp).toBeGreaterThanOrEqual(0);
  });

  it('should not go below level 1', async () => {
    mockUser.xp = 5;
    mockUser.level = 1;
    const result = await applyPenalty('skip', 'tracker1', 'user1', 100, 0);
    expect(result.level).toBe(1);
    expect(result.xp).toBe(0);
  });

  it('should pull tracker on missionFail', async () => {
    await applyPenalty('missionFail', 'tracker123', 'user1', 10, 10);
    expect(mockUser.trackers.pull).toHaveBeenCalledWith('tracker123');
  });

  it('should not pull tracker on skip', async () => {
    await applyPenalty('skip', 'tracker123', 'user1', 10, 10);
    expect(mockUser.trackers.pull).not.toHaveBeenCalled();
  });

  it('should call user.save()', async () => {
    await applyPenalty('skip', 'tracker1', 'user1', 10, 10);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('should return null if user not found', async () => {
    User.findById.mockResolvedValue(null);
    const result = await applyPenalty('skip', 'tracker1', 'user1', 10, 10);
    expect(result).toBeNull();
  });
});
