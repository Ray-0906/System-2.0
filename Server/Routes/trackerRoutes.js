import express from 'express';
import { dailyRefresh, deleteMissionTracker, abandonMissionTracker } from '../Controllers/trackerController.js';

const router =express.Router();

router.post('/daily-refresh',dailyRefresh);
router.delete('/:id', deleteMissionTracker); // Adjusted route to match the new function name
router.post('/:id/abandon', abandonMissionTracker);

export default router;
