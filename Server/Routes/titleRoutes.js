import express from 'express';
import { listTitles, unlockEligibleTitles, equipTitle } from '../Controllers/titleController.js';

const router = express.Router();

router.get('/', listTitles);
router.post('/unlock', unlockEligibleTitles);
router.post('/equip', equipTitle);

export default router;
