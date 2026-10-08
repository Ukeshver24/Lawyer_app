import userRepository from '../repositories/userRepository.js';
import judgmentRepository from '../repositories/judgmentRepository.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import adminSessionService from '../services/adminSessionService.js';
import { notifyMobileAppNewJudgement } from '../services/fcmService.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

export const adminLogin = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginIdentifier = (email || username || '').trim().toLowerCase();

    if (!loginIdentifier || !password) {
      return res.status(400).json({ status: 'error', message: 'Invalid email or password.' });
    }

    // 1. Find Admin Account in PostgreSQL DB
    const admin = await userRepository.findAdminByEmail(loginIdentifier);
    if (!admin) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    // Account status check (Disabled accounts cannot log in)
    if (admin.status === 'Disabled' || admin.is_active === false) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    // 2. Strict Password Verification with automatic fallback and hash upgrade
    let isMatch = false;
    if (admin.password_hash) {
      isMatch = await bcrypt.compare(password, admin.password_hash);
    }
    if (!isMatch && admin.password) {
      isMatch = (password === admin.password);
      if (isMatch) {
        const newHash = await bcrypt.hash(password, 10);
        await userRepository.updateAdminPasswordHash(admin.id, newHash, password);
      }
    }

    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Invalid email or password.' });
    }

    // Update last login timestamp
    await userRepository.updateLastLogin(admin.id);

    // 3. Role strictly determined by Database record
    const userRole = admin.role === 'MAIN_ADMIN' ? 'MAIN_ADMIN' : 'EXTRA_ADMIN';

    // Create server-side session
    const sessionInfo = adminSessionService.createSession({
      id: admin.id,
      email: admin.email || loginIdentifier,
      username: admin.username || loginIdentifier,
      role: userRole
    });

    // Sign JWT Token with sessionId
    const token = jwt.sign(
      { id: admin.id, email: admin.email || loginIdentifier, role: userRole, sessionId: sessionInfo.sessionId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set secure HttpOnly cookie for session
    if (res.cookie) {
      res.cookie('admin_session', sessionInfo.sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: sessionInfo.durationSeconds * 1000
      });
    }

    logger.info(`Admin login successful for ${loginIdentifier} (${userRole}). Session: ${sessionInfo.sessionId.substring(0, 8)}`);

    return res.json({
      status: 'success',
      message: 'Login successful',
      token,
      session: sessionInfo,
      user: {
        id: admin.id,
        name: admin.name || 'Admin User',
        email: admin.email || loginIdentifier,
        username: admin.username || loginIdentifier,
        role: userRole
      }
    });

  } catch (error) {
    logger.error('Admin login error', error);
    return res.status(500).json({ status: 'error', message: 'Invalid email or password.' });
  }
};

/**
 * Admin Logout Controller
 * Destroys server-side session and clears authentication cookies
 */
export const adminLogout = async (req, res) => {
  try {
    const sessionId = req.headers['x-admin-session-id'] || (req.cookies && req.cookies.admin_session) || (req.user && req.user.sessionId);
    if (sessionId) {
      adminSessionService.destroySession(sessionId);
    }
    if (res.clearCookie) {
      res.clearCookie('admin_session');
    }
    return res.json({ status: 'success', message: 'Admin session logged out successfully.' });
  } catch (error) {
    logger.error('Admin logout error', error);
    if (res.clearCookie) res.clearCookie('admin_session');
    return res.json({ status: 'success', message: 'Admin session cleared.' });
  }
};

/**
 * Get Server-Side Admin Session Status
 */
export const getSessionStatus = async (req, res) => {
  try {
    const sessionId = req.headers['x-admin-session-id'] || (req.cookies && req.cookies.admin_session) || (req.user && req.user.sessionId);
    const session = adminSessionService.getSession(sessionId);

    if (!session) {
      if (res.clearCookie) res.clearCookie('admin_session');
      return res.status(401).json({ status: 'error', code: 'SESSION_EXPIRED', message: 'Admin session has expired. Please log in again.' });
    }

    const remainingMs = Math.max(0, session.expiresAt - Date.now());
    const warningWindowMs = parseInt(process.env.ADMIN_WARNING_WINDOW || '20', 10) * 1000;

    return res.json({
      status: 'success',
      active: true,
      expiresAt: session.expiresAt,
      remainingSeconds: Math.floor(remainingMs / 1000),
      warningWindowSeconds: Math.floor(warningWindowMs / 1000)
    });
  } catch (error) {
    logger.error('Get session status error', error);
    return res.status(401).json({ status: 'error', code: 'SESSION_EXPIRED', message: 'Invalid session.' });
  }
};

/**
 * Explicit Session Renewal Controller (Called ONLY when admin clicks Continue Session)
 */
export const renewAdminSession = async (req, res) => {
  try {
    const sessionId = req.headers['x-admin-session-id'] || (req.cookies && req.cookies.admin_session) || (req.user && req.user.sessionId);
    
    if (!sessionId) {
      return res.status(401).json({ status: 'error', code: 'SESSION_EXPIRED', message: 'Session ID missing. Renewal denied.' });
    }

    const renewalResult = adminSessionService.renewSession(sessionId);

    if (!renewalResult.success) {
      if (res.clearCookie) res.clearCookie('admin_session');
      return res.status(401).json({ status: 'error', code: 'SESSION_EXPIRED', message: renewalResult.message });
    }

    return res.json({
      status: 'success',
      message: 'Admin session explicitly renewed.',
      session: renewalResult
    });
  } catch (error) {
    logger.error('Renew admin session error', error);
    return res.status(401).json({ status: 'error', code: 'SESSION_EXPIRED', message: 'Failed to renew session.' });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const { name, username, password, role } = req.body;

    if (!name || !username || !password) {
      return res.status(400).json({ status: 'error', message: 'Name, Username, and Password are required' });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters long.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    
    const newAdmin = await userRepository.createAdmin({
      name: name.trim(),
      username: username.toLowerCase().trim(),
      password_hash,
      role: role || 'EXTRA_ADMIN',
      created_by: req.user?.id || 1
    });

    const { password: p, password_hash: ph, ...sanitized } = newAdmin || {};

    res.json({
      status: 'success',
      message: 'Sub-admin created successfully',
      data: sanitized
    });

  } catch (error) {
    logger.error('Create admin error', error);
    res.status(500).json({ status: 'error', message: 'Failed to create admin' });
  }
};

export const getAdmins = async (req, res) => {
  try {
    const rawAdmins = await userRepository.getAdmins();
    const sanitizedAdmins = (rawAdmins || []).map(a => {
      const { password, password_hash, ...clean } = a;
      return clean;
    });
    res.json({
      status: 'success',
      data: sanitizedAdmins
    });
  } catch (error) {
    logger.error('Admin get users error', error);
    res.status(500).json({ status: 'error', message: 'Database error fetching admins' });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await userRepository.getAllUsers();
    res.json({
      status: 'success',
      data: users
    });
  } catch (error) {
    logger.error('Admin get users error', error);
    res.status(500).json({ status: 'error', message: 'Database error fetching users' });
  }
};

export const uploadJudgment = async (req, res) => {
  try {
    const {
      title, court_name, judgment_date, citationsData,
      petitioner_name, respondent_name, act_name,
      section_number, topics, head_note, content
    } = req.body;

    if (!title) {
      return res.status(400).json({ status: 'error', message: 'Title is required' });
    }

    let citation = '';
    if (citationsData) {
      try {
        const citationsArr = JSON.parse(citationsData);
        for (const c of citationsArr) {
          const dlrString = `${c.year} (${c.month}) DLR (${c.court}) ${c.count}`;
          const exists = await judgmentRepository.checkCitationExists(dlrString);
          if (exists) {
            return res.status(400).json({ status: 'error', message: `Citation ${dlrString} already exists in the database.` });
          }
        }
        citation = citationsArr.map(c => `${c.year} (${c.month}) DLR (${c.court}) ${c.count} : ${c.equivalent}`).join(', ');
      } catch (err) {
        logger.error('Error parsing citationsData', err);
        return res.status(400).json({ status: 'error', message: 'Invalid citation format' });
      }
    }

    const uploadBase = process.env.UPLOAD_PATH || 'uploads/';
    const pdfFilePath = req.file ? `/${uploadBase}${req.file.filename}` : null;

    const judgmentData = {
      title, court_name, judgment_date, citation,
      petitioner_name, respondent_name, act_name,
      section_number, topics, head_note, content, pdf_file_path: pdfFilePath
    };

    const insertedId = await judgmentRepository.createJudgment(judgmentData);
    
    // Dispatch FCM Push Notification to Mobile App users
    if (insertedId) {
      notifyMobileAppNewJudgement({
        id: insertedId,
        title: title,
        petitioner: petitioner_name,
        respondent: respondent_name,
        court: court_name,
        citation: citation
      }).catch(err => logger.error('FCM notification dispatch error:', err));
    }

    res.json({
      status: 'success',
      message: 'Judgment uploaded successfully',
      id: insertedId
    });
  } catch (error) {
    logger.error('Admin upload judgment error', error);
    res.status(500).json({ status: 'error', message: 'Database error' });
  }
};

export const checkCitation = async (req, res) => {
  try {
    const { dlrString, number, year, month, court, excludeId } = req.query;
    if (!number && !dlrString) {
      return res.json({ status: 'success', exists: false });
    }

    const queryNum = number || dlrString;
    const match = await judgmentRepository.checkCitationMatch(queryNum, year, month, court, excludeId);

    if (match && match.exists) {
      const cleanYr = year || '2026';
      const cleanMo = month ? String(month).padStart(2, '0') : '';
      const cleanCourt = (court || 'SC').toUpperCase();
      const monthDetail = cleanMo ? `(${cleanMo}) ` : '';

      return res.json({
        status: 'success',
        exists: true,
        message: `Citation #${queryNum} for ${cleanYr} ${monthDetail}${cleanCourt} is already registered in the database in case: "${match.caseTitle || 'Existing Case'}"!`,
        matchedCase: {
          id: match.caseId,
          title: match.caseTitle,
          caseNumber: match.caseNumber
        }
      });
    }

    res.json({
      status: 'success',
      exists: false
    });
  } catch (error) {
    logger.error('Admin check citation error', error);
    res.json({ status: 'success', exists: false });
  }
};

export const updateAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, currentPassword } = req.body;

    if (!username && !password) {
      return res.status(400).json({ status: 'error', message: 'Username or password is required' });
    }

    let passwordHash = null;
    if (password && String(password).trim()) {
      const cleanPass = String(password).trim();
      if (cleanPass.length < 8) {
        return res.status(400).json({ status: 'error', message: 'Password must be at least 8 characters long.' });
      }
      passwordHash = await bcrypt.hash(cleanPass, 10);
    }

    const updated = await userRepository.updateAdminCredentials(id, { 
      username: username ? String(username).trim().toLowerCase() : undefined, 
      password_hash: passwordHash 
    });

    const { password: p, password_hash: ph, ...sanitized } = updated || {};

    logger.info(`Admin credentials updated for ID ${id}`);

    return res.json({
      status: 'success',
      message: 'Admin details updated successfully',
      data: sanitized
    });
  } catch (error) {
    logger.error(`Admin update password error for ID ${req.params.id}`, error);
    return res.status(500).json({ status: 'error', message: 'Database error updating credentials' });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await userRepository.deleteAdmin(id);

    if (!deleted) {
      return res.status(400).json({ status: 'error', message: 'Cannot delete Main Admin or account not found' });
    }

    res.json({
      status: 'success',
      message: 'Sub-admin removed successfully'
    });
  } catch (error) {
    logger.error(`Admin delete error for ID ${req.params.id}`, error);
    res.status(500).json({ status: 'error', message: 'Database error removing admin' });
  }
};

export const getSettings = async (req, res) => {
  try {
    const settings = await userRepository.getSettings();
    res.json({
      status: 'success',
      data: settings
    });
  } catch (error) {
    logger.error('Error fetching settings:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching settings from database' });
  }
};

export const saveSettings = async (req, res) => {
  try {
    const saved = await userRepository.saveSettings(req.body);
    res.json({
      status: 'success',
      message: 'Settings updated successfully',
      data: saved
    });
  } catch (error) {
    logger.error('Error saving settings:', error);
    res.status(500).json({ status: 'error', message: 'Error saving settings to database' });
  }
};

/**
 * Main Admin Forgot Password Controller
 * Generates secure single-use reset token & dispatches email strictly for MAIN ADMIN
 */
export const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Please provide a valid email address.' 
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const admin = await userRepository.findAdminByEmail(cleanEmail);

    // ACCOUNT ENUMERATION PROTECTION:
    // If account not found or is ADDED ADMIN, return generic success response without token or email
    if (!admin || admin.role !== 'MAIN_ADMIN') {
      logger.info(`Password reset request ignored for non-main-admin: ${cleanEmail}`);
      return res.json({
        status: 'success',
        message: 'If an account is eligible for password reset, a password reset link has been sent.'
      });
    }

    // Generate cryptographically secure random token
    const crypto = await import('crypto');
    const { sendAdminPasswordResetEmail } = await import('../services/mailService.js');

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes expiration

    // Persist token hash securely
    await userRepository.savePasswordResetToken({
      adminId: admin.id,
      tokenHash,
      expiresAt
    });

    let baseUrl = process.env.FRONTEND_URL || process.env.APP_BASE_URL;
    if (!baseUrl || baseUrl.includes('localhost')) {
      const host = req.headers.host || req.get('host');
      if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
        const protocol = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
        baseUrl = `${protocol}://${host}`;
      } else {
        baseUrl = baseUrl || 'http://localhost:5173';
      }
    }
    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;

    await sendAdminPasswordResetEmail(admin.email || cleanEmail, resetUrl);

    logger.info(`Password reset link generated for Main Admin ID ${admin.id}`);

    return res.json({
      status: 'success',
      message: 'If an account is eligible for password reset, a password reset link has been sent.'
    });

  } catch (error) {
    logger.error('Admin forgot password error', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'If an account is eligible for password reset, a password reset link has been sent.' 
    });
  }
};

/**
 * Main Admin Validate Reset Token Controller
 * Pre-checks token validity and 3-minute expiration before rendering password form
 */
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This password reset link is invalid or has expired.' 
      });
    }

    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const tokenRecord = await userRepository.getPasswordResetToken(tokenHash);

    if (!tokenRecord || tokenRecord.used) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This password reset link is invalid or has expired.' 
      });
    }

    const expiresTime = new Date(tokenRecord.expiresAt).getTime();
    const createdTime = tokenRecord.createdAt ? new Date(tokenRecord.createdAt).getTime() : (expiresTime - 3 * 60 * 1000);
    const now = Date.now();

    if (now > expiresTime || (now - createdTime) > (3 * 60 * 1000 + 5000)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This password reset link has expired (valid for 3 minutes only).' 
      });
    }

    return res.json({
      status: 'success',
      message: 'Password reset link is valid.'
    });

  } catch (error) {
    logger.error('Validate reset token error', error);
    return res.status(400).json({ 
      status: 'error', 
      message: 'This password reset link is invalid or has expired.' 
    });
  }
};

/**
 * Main Admin Reset Password Controller
 * Validates single-use token, checks 3-minute expiration, hashes new password and updates credentials
 */
export const adminResetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string' || !token.trim()) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This password reset link is invalid or has expired.' 
      });
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Password must be at least 8 characters long.' 
      });
    }

    const crypto = await import('crypto');
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const tokenRecord = await userRepository.getPasswordResetToken(tokenHash);

    if (!tokenRecord || tokenRecord.used) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This password reset link is invalid or has expired.' 
      });
    }

    const expiresTime = new Date(tokenRecord.expiresAt).getTime();
    const createdTime = tokenRecord.createdAt ? new Date(tokenRecord.createdAt).getTime() : (expiresTime - 3 * 60 * 1000);
    const now = Date.now();

    if (now > expiresTime || (now - createdTime) > (3 * 60 * 1000 + 5000)) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This password reset link has expired (valid for 3 minutes only).' 
      });
    }

    const admin = await userRepository.findAdminById(tokenRecord.adminId);
    if (!admin || admin.role !== 'MAIN_ADMIN') {
      return res.status(400).json({ 
        status: 'error', 
        message: 'This password reset link is invalid or has expired.' 
      });
    }

    // Hash new password using bcrypt
    const newPasswordHash = await bcrypt.hash(password, 10);

    // Update Main Admin Password
    await userRepository.updateAdminPasswordHash(admin.id, newPasswordHash, password);

    // Invalidate single-use reset token
    await userRepository.markPasswordResetTokenUsed(tokenHash);

    logger.info(`Main Admin password successfully updated for ID ${admin.id}`);

    return res.json({
      status: 'success',
      message: 'Password reset successfully. You can now sign in with your new password.'
    });

  } catch (error) {
    logger.error('Admin reset password error', error);
    return res.status(400).json({ 
      status: 'error', 
      message: 'This password reset link is invalid or has expired.' 
    });
  }
};
