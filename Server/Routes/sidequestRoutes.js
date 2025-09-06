import express from 'express';
import { isAuthenticated } from '../Middlewares/authMiddleware.js';
import { createSidequest, getUserSidequests, completeSidequest } from '../Controllers/sidequestController.js';

const router = express.Router();

router.post('/', isAuthenticated, createSidequest);
router.get('/', isAuthenticated, getUserSidequests);
router.post('/:id/complete', isAuthenticated, completeSidequest);

export default router;
