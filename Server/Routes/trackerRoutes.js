import express from 'express';
import { dailyRefresh } from '../Controllers/trackerController.js';

const router =express.Router();

router.post('/daily-refresh',dailyRefresh);

export default router;
