import express from 'express';
import { getSEOData, updateSEOData } from '../controllers/seoController.js';

const router = express.Router();

router.get('/', getSEOData);
router.post('/', updateSEOData);

export default router;
