/**
 * MissionController — thin HTTP layer for mission creation and deletion.
 * All business logic lives in missionService.js.
 */
import * as missionService from '../services/missionService.js';
import { handleServiceError } from '../utils/serviceError.js';

export const addGeneratedMission = async (req, res) => {
  try {
    const result = await missionService.generateMission(req.body.description, req.body.days);
    return res.status(201).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const createCustomMission = async (req, res) => {
  try {
    const result = await missionService.createCustomMission(req.body.tasks, req.body.days);
    return res.status(201).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const deleteMission = async (req, res) => {
  try {
    const result = await missionService.deleteMission(req.user._id, req.body.missionId);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};
