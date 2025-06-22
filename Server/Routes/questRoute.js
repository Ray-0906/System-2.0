import express from 'express';
import { completeQuest } from '../Controllers/questController.js';

const router = express.Router();

router.post('/complete',completeQuest);


export default router;