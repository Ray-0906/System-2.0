import express from 'express';
import { listTitles, unlockEligibleTitles, equipTitle, seedDefaultTitles } from '../Controllers/titleController.js';

const router = express.Router();

router.get('/', listTitles);
router.post('/unlock', unlockEligibleTitles);
router.post('/equip', equipTitle);
router.post('/seed', seedDefaultTitles);

export default router;
