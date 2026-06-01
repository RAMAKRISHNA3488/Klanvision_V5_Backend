import express from 'express';
import { login, verify2FA, generate2FA, setupAdmin, getAllUsers, createUser, updateUser, deleteUser } from '../controllers/adminController.js';

const router = express.Router();

router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.get('/generate-2fa', generate2FA);
router.post('/setup', setupAdmin);

// User Directory Management
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

export default router;
