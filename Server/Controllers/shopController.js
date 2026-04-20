/**
 * ShopController — thin HTTP layer for equipment purchases.
 * All business logic lives in shopService.js.
 */
import { purchaseEquipment } from '../services/shopService.js';
import { handleServiceError } from '../utils/serviceError.js';

export const buyEquipment = async (req, res) => {
  try {
    const result = await purchaseEquipment(req.user._id, req.body.equipmentId);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};
