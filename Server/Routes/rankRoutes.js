import express from 'express';
import { evaluateRankAscension } from '../Controllers/rankController.js';

const router = express.Router();

router.get('/ascension', evaluateRankAscension);

export default router;
