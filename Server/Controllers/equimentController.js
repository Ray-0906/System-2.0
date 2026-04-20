/**
 * EquimentController — thin HTTP layer.
 * Delegates to shopService, skillUnlockService, and rankController.
 *
 * NOTE: This controller contains LEGACY duplicates of buyEquipment, unlockSkill,
 * and evaluateRankAscension. These are now handled by their dedicated controllers
 * (shopController, skillController, rankController). This file is kept for
 * backward-compatible route bindings in equimentRoutes.js.
 */
import { buyEquipment } from './shopController.js';
import { unlockSkill } from './skillController.js';
import { evaluateRankAscension } from './rankController.js';

// Re-export from the dedicated controllers
export { buyEquipment, unlockSkill, evaluateRankAscension };
