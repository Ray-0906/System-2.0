import express from 'express';
import { chatWithAssistant, getHistory, clearHistory } from '../Controllers/assistantController.js';

const router = express.Router();

router.post('/chat', chatWithAssistant);
router.get('/history', getHistory);
router.delete('/history', clearHistory);

export default router;
