/**
 * QuestController — thin HTTP layer for quest completion and upgrades.
 * All business logic lives in questService.js.
 */
import { completeQuest as completeQuestService, upgradeTrackerQuests } from '../services/questService.js';
import { handleServiceError } from '../utils/serviceError.js';

export const completeQuest = async (req, res) => {
  try {
    const { questId, trackerid } = req.body;
    const result = await completeQuestService(req.user.id, questId, trackerid);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const upgradeTracker = async (req, res) => {
  try {
    const result = await upgradeTrackerQuests(req.user.id, req.body.trackerId);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};