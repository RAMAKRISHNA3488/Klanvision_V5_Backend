import express from 'express';
import multer from 'multer';
import { register, login, getProfile, downloadResume } from '../controllers/candidateController.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/register', upload.single('resume'), register);
router.post('/login', login);
router.get('/:id', getProfile);
router.get('/resume/:id', downloadResume);

export default router;
