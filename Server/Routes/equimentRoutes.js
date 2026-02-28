import { buyEquipment } from "../Controllers/shopController.js";
import express from "express";
import { validate } from '../Middlewares/validate.js';
import { buyEquipmentSchema } from '../schemas/index.js';

const router = express.Router();

// Route to buy equipment
router.post('/buy', validate(buyEquipmentSchema), buyEquipment);

export default router;
