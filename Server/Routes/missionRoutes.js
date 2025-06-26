import express from 'express';
import { addGeneratedMission, createCustomMission, deleteMission } from '../Controllers/missionController.js';
import { joinMission } from '../Controllers/trackerController.js';
import { upgradeTracker } from '../Controllers/questController.js';

const router = express.Router();

router.post('/create',addGeneratedMission);
router.post('/createCustom',createCustomMission);
router.post('/join',joinMission);
router.post('/upgrade',upgradeTracker);
router.post('/delete', deleteMission);

export default router;