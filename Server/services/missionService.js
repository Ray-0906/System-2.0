/**
 * MissionService — mission creation business logic.
 * Extracted from missionController.js for clean separation.
 */
import { ServiceError } from '../utils/serviceError.js';
import { missionRepo } from '../repositories/missionRepository.js';
import { questRepo } from '../repositories/questRepository.js';
import { generateMissionWithLLM } from '../libs/generateQuest.js';
import { generateMissionFromTasks } from '../libs/customMissionGenerator.js';

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

  const generated = await generateMissionWithLLM(description, days);
  const { title, refinedDescription, quests, reward, penalty, rank } = generated;

  // Create quest documents
  const questDocs = await questRepo.createMany(
    quests.map(q => ({ title: q.title, statAffected: q.statAffected, xp: q.xp }))
  );
  const questIds = questDocs.map(q => q._id);

  // Create mission
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
 * Create a custom mission from user tasks.
 * @param {Array} tasks
 * @param {number} days
 * @returns {object} { mission, quests }
 */
export const createCustomMission = async (tasks, days) => {
  const generated = await generateMissionFromTasks(tasks, days);
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
