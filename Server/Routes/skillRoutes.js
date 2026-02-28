import express from 'express';
import { unlockSkill } from '../Controllers/skillController.js';
import { validate } from '../Middlewares/validate.js';
import { unlockSkillSchema } from '../schemas/index.js';

const router = express.Router();
router.post('/unlock', validate(unlockSkillSchema), unlockSkill);

export default router;