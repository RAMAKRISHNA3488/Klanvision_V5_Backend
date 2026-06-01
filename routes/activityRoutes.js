import express from 'express';
import { getAllActivities, addActivity } from '../controllers/activityController.js';

const router = express.Router();

router.get('/', getAllActivities);
router.post('/', addActivity);

export default router;
