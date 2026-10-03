import express from 'express';
import { 
  adminLogin, adminLogout, getSessionStatus, renewAdminSession,
  uploadJudgment, getUsers, createAdmin, 
  getAdmins, checkCitation, updateAdminPassword, deleteAdmin,
  getSettings, saveSettings, adminForgotPassword, adminResetPassword, validateResetToken
} from '../controllers/adminController.js';
import upload from '../middleware/uploadMiddleware.js';
import { verifyAdminSession, preventCache } from '../middleware/authMiddleware.js';
import { forgotPasswordRateLimiter, loginRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public Auth & Password Reset Routes
router.post('/login', loginRateLimiter, adminLogin);
router.post('/forgot-password', forgotPasswordRateLimiter, adminForgotPassword);
router.get('/validate-reset-token', validateResetToken);
router.post('/reset-password', adminResetPassword);

// Session Routes (Protected)
router.post('/logout', verifyAdminSession, adminLogout);
router.get('/session-status', verifyAdminSession, getSessionStatus);
router.post('/renew-session', verifyAdminSession, renewAdminSession);

// Protected Admin Management Routes
router.get('/admins', verifyAdminSession, getAdmins);
router.post('/admins', verifyAdminSession, createAdmin);
router.put('/admins/:id/password', verifyAdminSession, updateAdminPassword);
router.delete('/admins/:id', verifyAdminSession, deleteAdmin);

// Settings Routes (Protected)
router.get('/settings', verifyAdminSession, getSettings);
router.post('/settings', verifyAdminSession, saveSettings);

// User & Judgment Management Routes (Protected)
router.get('/users', verifyAdminSession, getUsers);
router.get('/judgments/check-citation', checkCitation);
router.post('/judgments', verifyAdminSession, upload.single('pdfFile'), uploadJudgment);

export default router;
