/**
 * SkillController — thin HTTP layer for skill unlocking.
 * All business logic lives in skillUnlockService.js.
 */
import { unlockSkill as unlockSkillService } from '../services/skillUnlockService.js';
import { handleServiceError } from '../utils/serviceError.js';

export const unlockSkill = async (req, res) => {
  try {
    const result = await unlockSkillService(req.user.id, req.body.skillId);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};
