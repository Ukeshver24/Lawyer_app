import crypto from 'crypto';
import logger from '../utils/logger.js';
import { query } from '../config/db.js';
import dotenv from 'dotenv';
dotenv.config();

// Session Duration in seconds (Default: 3600 seconds = 1 hour)
const getSessionDurationMs = () => {
  const durationSec = parseInt(process.env.ADMIN_SESSION_DURATION || '3600', 10);
  return (isNaN(durationSec) ? 3600 : durationSec) * 1000;
};

// Warning window in seconds (Default: 20 seconds)
const getWarningWindowMs = () => {
  const warningSec = parseInt(process.env.ADMIN_WARNING_WINDOW || '20', 10);
  return (isNaN(warningSec) ? 20 : warningSec) * 1000;
};

// In-memory active session map
const activeSessions = new Map();

class AdminSessionService {
  /**
   * Create a new server-side admin session
   * @param {Object} admin - Admin user object { id, email, role, username }
   */
  createSession(admin) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const durationMs = getSessionDurationMs();
    const warningMs = getWarningWindowMs();
    const now = Date.now();
    const expiresAt = now + durationMs;

    const sessionData = {
      sessionId,
      adminId: String(admin.id),
      email: admin.email || admin.username,
      role: admin.role || 'MAIN_ADMIN',
      createdAt: now,
      expiresAt: expiresAt,
      lastActivity: now
    };

    activeSessions.set(sessionId, sessionData);

    // Persist to PostgreSQL admin_sessions table asynchronously
    query(`
      INSERT INTO admin_sessions (session_id, admin_id, email, role, created_at, expires_at, last_activity)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (session_id) DO UPDATE
      SET expires_at = EXCLUDED.expires_at, last_activity = EXCLUDED.last_activity
    `, [sessionId, sessionData.adminId, sessionData.email, sessionData.role, now, expiresAt, now])
    .catch(err => {
      logger.debug('PostgreSQL admin_sessions insert error (continuing with in-memory):', err.message);
    });

    logger.info(`[ADMIN SESSION] Created session ${sessionId.substring(0, 8)}... for Admin ID ${admin.id}. Expires in ${durationMs / 1000}s`);

    return {
      sessionId,
      expiresAt,
      durationSeconds: durationMs / 1000,
      warningWindowSeconds: warningMs / 1000
    };
  }

  /**
   * Get and validate an active admin session
   * @param {string} sessionId 
   */
  getSession(sessionId) {
    if (!sessionId) return null;

    const session = activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    // Check server-side expiration strictly
    if (Date.now() > session.expiresAt) {
      logger.info(`[ADMIN SESSION] Session ${sessionId.substring(0, 8)}... expired on server. Invalidating.`);
      this.destroySession(sessionId);
      return null;
    }

    return session;
  }

  /**
   * Explicitly renew an active session for another full duration (Only when admin clicks Continue Session)
   * @param {string} sessionId 
   */
  renewSession(sessionId) {
    const session = this.getSession(sessionId);

    if (!session) {
      return { success: false, message: 'Session expired or invalid. Renewal denied.' };
    }

    const durationMs = getSessionDurationMs();
    const now = Date.now();
    const newExpiresAt = now + durationMs;

    session.expiresAt = newExpiresAt;
    session.lastActivity = now;

    activeSessions.set(sessionId, session);

    // Update in PostgreSQL
    query(`
      UPDATE admin_sessions
      SET expires_at = $1, last_activity = $2
      WHERE session_id = $3
    `, [newExpiresAt, now, sessionId])
    .catch(err => {
      logger.debug('PostgreSQL admin_sessions renew error:', err.message);
    });

    logger.info(`[ADMIN SESSION] Explicitly RENEWED session ${sessionId.substring(0, 8)}... for another ${durationMs / 1000}s.`);

    return {
      success: true,
      sessionId,
      expiresAt: newExpiresAt,
      durationSeconds: durationMs / 1000,
      warningWindowSeconds: getWarningWindowMs() / 1000
    };
  }

  /**
   * Destroy an admin session (Logout or Expiration)
   * @param {string} sessionId 
   */
  destroySession(sessionId) {
    if (!sessionId) return;
    activeSessions.delete(sessionId);

    // Delete from PostgreSQL
    query(`DELETE FROM admin_sessions WHERE session_id = $1`, [sessionId])
    .catch(err => {
      logger.debug('PostgreSQL admin_sessions delete error:', err.message);
    });

    logger.info(`[ADMIN SESSION] Destroyed session ${sessionId.substring(0, 8)}...`);
  }
}

export default new AdminSessionService();
