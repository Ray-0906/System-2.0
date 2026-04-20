import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  generateMissionMock,
  generateCustomMissionMock,
  createManyMock,
  createMock,
  saveMock,
} = vi.hoisted(() => ({
  generateMissionMock: vi.fn(),
  generateCustomMissionMock: vi.fn(),
  createManyMock: vi.fn(),
  createMock: vi.fn(),
  saveMock: vi.fn(),
}));

vi.mock('../services/ragService.js', () => ({
  generateMission: generateMissionMock,
  generateCustomMission: generateCustomMissionMock,
}));

vi.mock('../repositories/questRepository.js', () => ({
  questRepo: {
    createMany: createManyMock,
  },
}));

vi.mock('../repositories/missionRepository.js', () => ({
  missionRepo: {
    create: createMock,
    save: saveMock,
  },
}));

import { generateMission, createCustomMission } from '../services/missionService.js';

describe('missionService delegation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createManyMock.mockResolvedValue([
      { _id: 'quest-1' },
      { _id: 'quest-2' },
    ]);
    createMock.mockReturnValue({ _id: 'mission-1' });
    saveMock.mockResolvedValue(undefined);
  });

  it('delegates free-form mission generation to RAG-Service', async () => {
    generateMissionMock.mockResolvedValue({
      title: 'Morning Momentum',
      refinedDescription: 'A structured fitness mission.',
      quests: [
        { title: 'Walk 20 minutes', statAffected: 'endurance', xp: 10 },
        { title: 'Journal progress', statAffected: 'intelligence', xp: 5 },
      ],
      reward: { xp: 100, coins: 20, specialReward: null },
      penalty: { missionFail: { coins: 10, stats: 2 }, skip: { coins: 5, stats: 1 } },
      rank: 'D',
    });

    const result = await generateMission('Build my stamina', 7);

    expect(generateMissionMock).toHaveBeenCalledWith('Build my stamina', 7);
    expect(createManyMock).toHaveBeenCalledWith([
      { title: 'Walk 20 minutes', statAffected: 'endurance', xp: 10 },
      { title: 'Journal progress', statAffected: 'intelligence', xp: 5 },
    ]);
    expect(createMock).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
    expect(result.mission).toEqual({ _id: 'mission-1' });
  });

  it('delegates custom mission generation to RAG-Service', async () => {
    generateCustomMissionMock.mockResolvedValue({
      title: 'Custom Focus',
      refinedDescription: 'A custom productivity mission.',
      quests: [
        { title: 'Read 10 pages', statAffected: 'intelligence', xp: 8 },
      ],
      reward: { xp: 80, coins: 15, specialReward: null },
      penalty: { missionFail: { coins: 10, stats: 1 }, skip: { coins: 5, stats: 0 } },
      rank: 'E',
    });

    const result = await createCustomMission([
      { title: 'Read 10 pages', statAffected: 'intelligence', xp: 8 },
    ], 5);

    expect(generateCustomMissionMock).toHaveBeenCalledWith([
      { title: 'Read 10 pages', statAffected: 'intelligence', xp: 8 },
    ], 5);
    expect(result.mission).toEqual({ _id: 'mission-1' });
  });
});