import { buyEquipment } from "../Controllers/equimentController.js";
import express from "express";

const router = express.Router();

// Route to buy equipment
router.post('/buy', buyEquipment);

export default router;
