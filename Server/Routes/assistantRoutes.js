import express from 'express';
import { chatWithAssistant, getHistory } from '../Controllers/assistantController.js';      

const router = express.Router();

router.post('/chat', chatWithAssistant);
router.get('/history', getHistory);
export default router;
