/**
 * AssistantController — thin HTTP layer for AI chat.
 */
import { chat, getChatHistory, clearChatHistory } from '../services/assistantService.js';
import { handleServiceError } from '../utils/serviceError.js';
import { ServiceError } from '../utils/serviceError.js';

export const getHistory = async (req, res) => {
  try {
    const result = await getChatHistory(req.user._id || req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const clearHistory = async (req, res) => {
  try {
    const result = await clearChatHistory(req.user._id || req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};

export const chatWithAssistant = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      throw new ServiceError('Message is required', 400);
    }
    const result = await chat(req.user._id || req.user.id, message.trim());
    return res.status(200).json(result);
  } catch (err) {
    return handleServiceError(res, err);
  }
};
