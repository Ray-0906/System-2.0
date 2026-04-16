/**
 * TrackerController — thin HTTP layer for tracker operations.
 * All business logic lives in trackerService.js.
 */
import * as trackerService from '../services/trackerService.js';
import { handleServiceError } from '../utils/serviceError.js';

export { createTrackerForUser } from '../services/trackerService.js';

export const joinMission = async (req, res) => {
  try {
    const result = await trackerService.joinMission(req.user._id, req.body.missionId);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const dailyRefresh = async (req, res) => {
  try {
    const { trackerId, penaltyType } = req.body;
    console.log('Daily Refresh Request:', { trackerId, penaltyType });
    const result = await trackerService.dailyRefresh(req.user._id, trackerId, penaltyType);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const deleteMissionTracker = async (req, res) => {
  try {
    const result = await trackerService.deleteTracker(req.user.id, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const abandonMissionTracker = async (req, res) => {
  try {
    const result = await trackerService.abandonTracker(req.user.id, req.body.trackerId);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};