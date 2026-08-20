import express from 'express';
import rateLimit,{ipKeyGenerator} from 'express-rate-limit';
import { addGeneratedMission, createCustomMission, deleteMission } from '../Controllers/missionController.js';
import { joinMission } from '../Controllers/trackerController.js';
import { upgradeTracker } from '../Controllers/questController.js';

const router = express.Router();

const missionLimiter = rateLimit({
    windowMs:60*1000,
    max:8,
    message:{
        status: "error",
        message: "Too many requests, please try again later"
    },
    keyGenerator:(req)=>req.user?._id?.toString()?? ipKeyGenerator(req),

})
router.post('/create',missionLimiter, addGeneratedMission);
router.post('/createCustom',missionLimiter, createCustomMission);
router.post('/join',joinMission);
router.post('/upgrade',missionLimiter, upgradeTracker);
router.post('/delete', deleteMission);

export default router;