import express from 'express';

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { chatWithAssistant, getHistory, clearHistory } from '../Controllers/assistantController.js';

const router = express.Router();

// Rate limit chat to 20 requests/min per user (each call triggers an LLM request)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) =>
    req.user?._id?.toString() ?? ipKeyGenerator(req),
  message: { msg: 'Too many requests. Please wait a moment.' },
});


router.post('/chat', chatLimiter, chatWithAssistant);
router.get('/history', getHistory);
router.delete('/history', clearHistory);

export default router;
