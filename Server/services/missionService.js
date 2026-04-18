/**
 * MissionService — mission creation business logic.
 * Extracted from missionController.js for clean separation.
 */
import { ServiceError } from '../utils/serviceError.js';
import { missionRepo } from '../repositories/missionRepository.js';
import { questRepo } from '../repositories/questRepository.js';
import * as ragService from './ragService.js';

const persistGeneratedMission = async (generated, days) => {
  const { title, refinedDescription, quests, reward, penalty, rank } = generated;

  const questDocs = await questRepo.createMany(
    quests.map(q => ({ title: q.title, statAffected: q.statAffected, xp: q.xp }))
  );
  const questIds = questDocs.map(q => q._id);

  const mission = missionRepo.create({
    title,
    description: refinedDescription,
    duration: days,
    quests: questIds,
    reward,
    penalty,
    rank,
    public: true,
    participants: [],
  });
  await missionRepo.save(mission);

  return { message: 'Mission generated and saved successfully.', mission, quests };
};

/**
 * Generate a mission using LLM.
 * @param {string} description
 * @param {number} days
 * @returns {object} { mission, quests }
 */
export const generateMission = async (description, days) => {
  if (!description || !days) {
    throw new ServiceError('Description and days are required.', 400);
  }

  const generated = await ragService.generateMission(description, days);
  if (!generated) {
    throw new ServiceError('Failed to generate mission from RAG service.', 502);
  }
  return persistGeneratedMission(generated, days);
};

/**
 * Create a custom mission from user tasks.
 * @param {Array} tasks
 * @param {number} days
 * @returns {object} { mission, quests }
 */
export const createCustomMission = async (tasks, days) => {
  const generated = await ragService.generateCustomMission(tasks, days);
  if (!generated) {
    throw new ServiceError('Failed to generate custom mission from RAG service.', 502);
  }
  return persistGeneratedMission(generated, days);
};

/**
 * Persist a pre-generated mission blueprint after explicit user confirmation.
 * @param {Object} generated
 * @param {number} days
 */
export const createMissionFromGenerated = async (generated, days) => {
  if (!generated || !Array.isArray(generated.quests) || generated.quests.length === 0) {
    throw new ServiceError('Invalid generated mission payload.', 400);
  }
  const duration = Number.isInteger(Number(days)) && Number(days) > 0 ? Number(days) : 7;
  return persistGeneratedMission(generated, duration);
};

/**
 * Delete a mission (authorization check included).
 */
export const deleteMission = async (userId, missionId) => {
  const mission = await missionRepo.findById(missionId);
  if (!mission) throw new ServiceError('Mission not found', 404);

  if (mission.createdBy && mission.createdBy.toString() !== userId) {
    throw new ServiceError('Not authorized to delete this mission', 403);
  }

  await missionRepo.deleteById(missionId);
  return { message: 'Mission deleted successfully' };
};
