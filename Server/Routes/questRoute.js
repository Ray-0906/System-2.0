import express from 'express';
import { completeQuest, upgradeTracker } from '../Controllers/questController.js';
import { validate } from '../Middlewares/validate.js';
import { completeQuestSchema, upgradeTrackerSchema } from '../schemas/index.js';

const router = express.Router();

router.post('/complete', validate(completeQuestSchema), completeQuest);

export default router;