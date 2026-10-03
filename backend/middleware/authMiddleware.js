import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';
import adminSessionService from '../services/adminSessionService.js';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

/**
 * Anti-Cache Headers Middleware for Admin Routes
 * Prevents browser Back button from displaying cached protected content after logout/expiration
 */
export const preventCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  if (next) next();
};

/**
 * Middleware to verify Admin JWT token AND Server-Side Session
 */
export const verifyAdminSession = (req, res, next) => {
  preventCache(req, res);

  try {
    const authHeader = req.headers.authorization;
    const sessionIdHeader = req.headers['x-admin-session-id'] || (req.cookies && req.cookies.admin_session);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ status: 'error', code: 'SESSION_EXPIRED', message: 'Authentication required. Missing token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check server-side session if sessionId exists
    const sessionId = sessionIdHeader || decoded.sessionId;

    if (sessionId) {
      const activeSession = adminSessionService.getSession(sessionId);
      if (!activeSession) {
        if (res.clearCookie) res.clearCookie('admin_session');
        return res.status(401).json({ 
          status: 'error', 
          code: 'SESSION_EXPIRED', 
          message: 'Admin session has expired. Please log in again.' 
        });
      }
      req.adminSession = activeSession;
    }

    // Attach decoded user info {id, email, role} to request
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token/Session verification failed:', error.message);
    if (res.clearCookie) res.clearCookie('admin_session');
    return res.status(401).json({ status: 'error', code: 'SESSION_EXPIRED', message: 'Invalid or expired session.' });
  }
};

export const verifyToken = verifyAdminSession;

/**
 * Middleware factory to authorize based on roles
 * @param {Array<string>} allowedRoles - Array of allowed roles e.g. ['SUPER_ADMIN', 'ADMIN']
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ status: 'error', message: 'Access denied. Role not found.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Access denied. You do not have permission to perform this action.' 
      });
    }

    next();
  };
};
