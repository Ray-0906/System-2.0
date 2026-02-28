import { describe, it, expect } from 'vitest';
import { recalcUserLevel, recalcStatLevel, applyXPGain } from '../services/levelService.js';

// Helper to create a mock user
const createMockUser = (overrides = {}) => ({
  level: 1,
  xp: 0,
  coins: 100,
  stats: {
    strength: { value: 0, level: 1 },
    intelligence: { value: 0, level: 1 },
    agility: { value: 0, level: 1 },
    endurance: { value: 0, level: 1 },
    charisma: { value: 0, level: 1 },
  },
  ...overrides,
});

describe('recalcUserLevel', () => {
  it('should not level up when XP is below threshold', () => {
    const user = createMockUser({ xp: 5, level: 1 });
    const result = recalcUserLevel(user);
    expect(result).toBe(false);
    expect(user.level).toBe(1);
  });

  it('should level up when XP meets threshold', () => {
    // Level 1 threshold is 40 (from generateThresholds(169, 40, 2.3, 0))
    const user = createMockUser({ xp: 50, level: 1 });
    const result = recalcUserLevel(user);
    expect(result).toBe(true);
    expect(user.level).toBe(2);
    expect(user.xp).toBeLessThan(50); // XP should be reduced by threshold
  });

  it('should handle multi-level ups with large XP', () => {
    const user = createMockUser({ xp: 500, level: 1 });
    recalcUserLevel(user);
    expect(user.level).toBeGreaterThan(2);
  });

  it('should not crash at very high levels', () => {
    const user = createMockUser({ xp: 10, level: 100 });
    expect(() => recalcUserLevel(user)).not.toThrow();
  });
});

describe('recalcStatLevel', () => {
  it('should not level up stat when value is below threshold', () => {
    const user = createMockUser();
    user.stats.strength.value = 5;
    const result = recalcStatLevel(user, 'strength');
    expect(result).toBe(false);
    expect(user.stats.strength.level).toBe(1);
  });

  it('should level up stat when value meets threshold', () => {
    const user = createMockUser();
    // Level 1 stat threshold is 20 (from generateThresholds(169, 20, 2.1))
    user.stats.strength.value = 25;
    const result = recalcStatLevel(user, 'strength');
    expect(result).toBe(true);
    expect(user.stats.strength.level).toBe(2);
  });

  it('should work for different stat types', () => {
    const user = createMockUser();
    user.stats.intelligence.value = 25;
    recalcStatLevel(user, 'intelligence');
    expect(user.stats.intelligence.level).toBe(2);
  });
});

describe('applyXPGain', () => {
  it('should add XP and stat value correctly', () => {
    const user = createMockUser();
    applyXPGain(user, 10, 'strength', 5);
    expect(user.xp).toBeGreaterThanOrEqual(10);
    expect(user.stats.strength.value).toBeGreaterThanOrEqual(5);
  });

  it('should return level-up flags', () => {
    const user = createMockUser({ xp: 35 });
    const result = applyXPGain(user, 10, 'strength', 5);
    expect(result).toHaveProperty('userLeveledUp');
    expect(result).toHaveProperty('statLeveledUp');
  });

  it('should trigger user level up with enough XP', () => {
    const user = createMockUser({ xp: 0 });
    const result = applyXPGain(user, 100, 'strength', 5);
    expect(result.userLeveledUp).toBe(true);
    expect(user.level).toBeGreaterThan(1);
  });
});
