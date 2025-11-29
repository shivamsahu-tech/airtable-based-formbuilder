import { Router } from 'express';
import { startLogin, handleCallback, getCurrentUser, logout } from '../controllers/authController.js';

const router = Router();

router.get('/login', startLogin);
router.get('/callback', handleCallback);
router.get('/me', getCurrentUser);
router.post('/logout', logout);

export default router;
