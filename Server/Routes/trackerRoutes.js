import express from 'express';
import { dailyRefresh, deleteMissionTracker } from '../Controllers/trackerController.js';

const router =express.Router();

router.post('/daily-refresh',dailyRefresh);
router.delete('/:id', deleteMissionTracker); // Adjusted route to match the new function name

export default router;
