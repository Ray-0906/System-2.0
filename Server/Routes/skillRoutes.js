import express from 'express';
import { unlockSkill } from '../Controllers/equimentController.js';

const router = express.Router();
router.post('/unlock', unlockSkill);

export default router;