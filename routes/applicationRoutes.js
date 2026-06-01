import express from 'express';
import multer from 'multer';
import { submitApplication, getAllApplications, getResume, deleteApplication } from '../controllers/applicationController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/', upload.single('resume'), submitApplication);
router.get('/', getAllApplications);
router.get('/resume/:id', getResume);
router.delete('/:id', deleteApplication);

export default router;
