import express from 'express';
import { login, signup, resetMpin, getSavedCases, saveCases, getProfile, deleteAccount } from '../controllers/authController.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/login', loginRateLimiter, login);
router.post('/signup', loginRateLimiter, signup);
router.post('/reset-mpin', loginRateLimiter, resetMpin);
router.get('/profile/:identifier', getProfile);
router.delete('/account/:identifier', deleteAccount);
router.get('/saved-cases/:identifier', getSavedCases);
router.post('/saved-cases', saveCases);

export default router;
