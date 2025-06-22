import express from 'express';
import { addGeneratedMission } from '../Controllers/missionController.js';
import { joinMission } from '../Controllers/trackerController.js';

const router = express.Router();

router.post('/create',addGeneratedMission);
router.post('/join',joinMission);

export default router;