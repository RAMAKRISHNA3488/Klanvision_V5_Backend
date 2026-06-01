import express from 'express';
import { getActiveJobs, getAllJobs, createJob, updateJob, deleteJob } from '../controllers/jobController.js';

const router = express.Router();

router.get('/', getActiveJobs);
router.get('/all', getAllJobs);
router.post('/', createJob);
router.put('/:id', updateJob);
router.delete('/:id', deleteJob);

export default router;
