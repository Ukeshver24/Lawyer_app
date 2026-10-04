import { query } from '../config/db.js';
import logger from '../utils/logger.js';

const defaultSettings = {
  profile: {
    name: 'Main Admin',
    email: 'digitallawreporter@gmail.com',
    mobile: '+91 98765 43210'
  },
  office: {
    lawChambersName: 'DIGI LAW REPORTER CHAMBERS & LEGAL RESEARCH CENTRE',
    officeAddress: 'Chamber No. 402, High Court Lawyers Block, Supreme Court Enclave, New Delhi - 110001',
    primaryPhone: '+91 98765 43210',
    secondaryPhone: '+91 11 2345 6789',
    primaryEmail: 'contact@digilawreporter.in',
    secondaryEmail: 'support@digilawreporter.in',
    workingHours: 'Monday to Saturday: 9:00 AM - 7:00 PM'
  },
  aboutPage: {
    pageHeading: 'Pioneering Digital Legal Intelligence & Supreme Court Precedents',
    pageSubheading: 'Empowering Advocates, Judiciary Members & Legal Researchers with Authentic Case Law Insights',
    aboutParagraph1: 'Digi Law Reporter is India’s premier digital legal reporting platform dedicated to publishing authentic, verified Supreme Court and High Court precedents with full citation authority.',
    aboutParagraph2: 'Engineered by Advocate on Record practitioners, our mission is to make comprehensive legal search instantaneous, reliable, and accessible across the country.',
    founder1Name: 'Adv. Rajesh Sharma',
    founder1Title: 'Founder & Senior Advocate',
    founder1Court: 'Supreme Court of India',
    founder1Experience: '24+ Years Experience',
    founder1BarNo: 'D/1482/2000',
    founder1Bio: 'Senior Advocate specializing in Constitutional Law, Civil Appeals & Special Leave Petitions.',
    founder1Image: '',
    founder2Name: 'Adv. Priya Venkatesh',
    founder2Title: 'Co-Founder & Advocate on Record',
    founder2Court: 'Supreme Court of India',
    founder2Experience: '18+ Years Experience',
    founder2BarNo: 'D/892/2006',
    founder2Bio: 'Advocate on Record with extensive practice in Commercial Arbitration and Corporate Precedents.',
    founder2Image: ''
  }
};

class UserRepository {
  async findByMobile(mobile) {
    const { rows } = await query('SELECT * FROM users WHERE mobile = $1', [mobile]);
    return rows[0] || null;
  }

  async findByEmail(email) {
    const { rows } = await query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  }

  async findProfileByIdentifier(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim();
    const isNumId = /^\d+$/.test(clean) && clean.length < 8;
    
    let sql;
    let params;
    if (isNumId) {
      sql = `
        SELECT id, name, mobile, email, role, status, is_active, joined_date, last_login, dob, created_at 
        FROM users 
        WHERE id = $1 OR mobile = $2
        LIMIT 1
      `;
      params = [parseInt(clean, 10), clean];
    } else {
      sql = `
        SELECT id, name, mobile, email, role, status, is_active, joined_date, last_login, dob, created_at 
        FROM users 
        WHERE mobile = $1 OR LOWER(email) = LOWER($1)
        LIMIT 1
      `;
      params = [clean];
    }
    const { rows } = await query(sql, params);
    return rows[0] || null;
  }

  async deleteUserAccount(identifier) {
    if (!identifier) return false;
    const clean = String(identifier).trim();
    const isNumId = /^\d+$/.test(clean) && clean.length < 8;

    // Find user first to ensure they are not MAIN_ADMIN
    const user = await this.findProfileByIdentifier(clean);
    if (!user) return false;
    if (user.role === 'MAIN_ADMIN' || String(user.id) === '1') {
      throw new Error('Main Admin account cannot be deleted.');
    }

    // 1. Delete saved cases from user_saved_cases
    await query('DELETE FROM user_saved_cases WHERE user_identifier = $1 OR user_identifier = $2', [
      clean,
      String(user.mobile || '')
    ]);

    // 2. Permanently delete user record from users table
    const deleteSql = isNumId 
      ? 'DELETE FROM users WHERE id = $1 OR mobile = $2'
      : 'DELETE FROM users WHERE mobile = $1 OR id = $2';
    
    await query(deleteSql, [isNumId ? parseInt(clean, 10) : clean, isNumId ? String(user.mobile) : user.id]);
    return true;
  }

  async createUser({ name, mobile, email, password_hash, dob }) {
    const sql = `
      INSERT INTO users (
        name,
        mobile,
        email,
        password_hash,
        dob,
        role,
        is_active,
        joined_date,
        last_login
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        'USER',
        TRUE,
        CURRENT_DATE,
        CURRENT_TIMESTAMP
      )
      RETURNING id, name, mobile, email, role, is_active, joined_date, created_at, last_login, dob
    `;

    const { rows } = await query(sql, [
      name.trim(),
      mobile.trim(),
      email || null,
      password_hash,
      dob
    ]);

    return rows[0] || null;
  }

  async updateUserLogin(mobile) {
    const sql = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP
      WHERE mobile = $1
      RETURNING id, name, mobile, email, role, is_active, created_at, last_login, dob
    `;

    const { rows } = await query(sql, [mobile.trim()]);
    return rows[0] || null;
  }

  async verifyAndResetMpin(mobile, dob, newPasswordHash) {
    const cleanMobile = String(mobile).trim();
    const user = await this.findByMobile(cleanMobile);
    if (!user) return { success: false, reason: 'not_found' };

    const normalize = (d) => {
      if (!d) return '';
      const str = String(d).trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        const [day, mon, yr] = str.split('/');
        return `${yr}-${mon.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        return str.slice(0, 10);
      }
      return str;
    };

    const userDob = normalize(user.dob);
    const inputDob = normalize(dob);

    if (!userDob || userDob !== inputDob) {
      return { success: false, reason: 'dob_mismatch' };
    }

    const sql = `
      UPDATE users 
      SET password_hash = $1, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE mobile = $2
      RETURNING id, name, mobile, email, role, is_active, created_at, last_login, dob
    `;
    const { rows } = await query(sql, [newPasswordHash, cleanMobile]);
    return { success: true, user: rows[0] };
  }

  async createAdmin({ name, username, email, password_hash, role, created_by }) {
    const cleanUsername = (username || name.toLowerCase().replace(/\s+/g, '')).trim();
    const cleanEmail = email || `${cleanUsername}@digilawreporter.in`;
    const cleanRole = role || 'EXTRA_ADMIN';

    // 1. Insert into admins table
    const sqlAdmins = `
      INSERT INTO admins (name, username, email, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (username) DO UPDATE
      SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
      RETURNING id, name, username, email, role, created_at
    `;
    const adminRes = await query(sqlAdmins, [name, cleanUsername, cleanEmail, password_hash, cleanRole]);

    // 2. Also insert or sync into users table for unified listing
    const fakeMobile = 'ADMIN_' + Date.now().toString().slice(-10);
    const sqlUsers = `
      INSERT INTO users (name, mobile, email, password_hash, role, created_by) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      ON CONFLICT (mobile) DO NOTHING
    `;
    await query(sqlUsers, [name, fakeMobile, cleanEmail, password_hash, cleanRole, created_by || null]);

    return adminRes.rows[0] || null;
  }

  async getAllUsers() {
    const sql = "SELECT id, name, mobile, email, status, joined_date, last_login, created_at FROM users WHERE role = 'USER' ORDER BY id DESC, created_at DESC";
    const { rows } = await query(sql);
    return rows;
  }

  async getAdmins() {
    const sql = `
      SELECT id, name, username, email, role, created_at 
      FROM admins 
      ORDER BY id ASC, created_at ASC
    `;
    const { rows } = await query(sql);
    return rows;
  }

  async updateLastLogin(id) {
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [numericId]);
      await query('UPDATE admins SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [numericId]);
    }
  }

  async findAdminByEmail(emailIdentifier) {
    if (!emailIdentifier) return null;
    const clean = String(emailIdentifier).trim().toLowerCase();

    // 1. Check admins table first (primary)
    const sqlAdmins = "SELECT * FROM admins WHERE LOWER(email) = $1 OR LOWER(username) = $1";
    const { rows: adminRows } = await query(sqlAdmins, [clean]);
    if (adminRows[0]) return adminRows[0];

    // 2. Check users table
    const sqlUsers = "SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(mobile) = $1 OR LOWER(name) = $1";
    const { rows: userRows } = await query(sqlUsers, [clean]);
    const matchedUser = userRows.find(u => u.role === 'MAIN_ADMIN' || u.role === 'EXTRA_ADMIN');
    if (matchedUser) return matchedUser;

    return null;
  }

  async findAdminById(adminId) {
    if (!adminId) return null;
    const numericId = parseInt(adminId, 10);
    if (isNaN(numericId)) return null;

    const sqlAdmins = "SELECT * FROM admins WHERE id = $1";
    const { rows: adminRows } = await query(sqlAdmins, [numericId]);
    if (adminRows[0]) return adminRows[0];

    const sqlUsers = "SELECT * FROM users WHERE id = $1 AND role != 'USER'";
    const { rows: userRows } = await query(sqlUsers, [numericId]);
    if (userRows[0]) return userRows[0];

    return null;
  }

  async savePasswordResetToken({ adminId, tokenHash, expiresAt }) {
    const sql = `
      INSERT INTO password_reset_tokens (admin_id, token_hash, expires_at, used)
      VALUES ($1, $2, $3, false)
    `;
    await query(sql, [String(adminId), tokenHash, expiresAt]);
  }

  async getPasswordResetToken(tokenHash) {
    const sql = "SELECT * FROM password_reset_tokens WHERE token_hash = $1";
    const { rows } = await query(sql, [tokenHash]);
    if (rows[0]) {
      return {
        adminId: rows[0].admin_id,
        tokenHash: rows[0].token_hash,
        expiresAt: rows[0].expires_at,
        used: rows[0].used
      };
    }
    return null;
  }

  async markPasswordResetTokenUsed(tokenHash) {
    const sql = "UPDATE password_reset_tokens SET used = true WHERE token_hash = $1";
    await query(sql, [tokenHash]);
  }

  async updateAdminPasswordHash(adminId, passwordHash) {
    const numericId = parseInt(adminId, 10);
    if (!isNaN(numericId)) {
      await query('UPDATE admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, numericId]);
      await query('UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [passwordHash, numericId]);
    }
  }

  async updateAdminCredentials(id, { username, password_hash }) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return null;

    const sql = `
      UPDATE admins 
      SET 
        username = COALESCE($1, username), 
        password_hash = COALESCE($2, password_hash), 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $3 
      RETURNING id, name, username, email, role
    `;
    const { rows } = await query(sql, [username || null, password_hash || null, numericId]);
    return rows[0] || null;
  }

  async deleteAdmin(id) {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return false;

    // Never delete MAIN_ADMIN
    const admin = await this.findAdminById(numericId);
    if (!admin || admin.role === 'MAIN_ADMIN' || String(admin.id) === '1') {
      return false;
    }

    await query("DELETE FROM admins WHERE id = $1 AND role != 'MAIN_ADMIN'", [numericId]);
    await query("DELETE FROM users WHERE id = $1 AND role != 'MAIN_ADMIN'", [numericId]);
    return true;
  }

  async getSavedCases(identifier) {
    if (!identifier) return [];
    try {
      const sql = "SELECT cases FROM user_saved_cases WHERE user_identifier = $1";
      const { rows } = await query(sql, [String(identifier)]);
      if (rows[0] && rows[0].cases) {
        return Array.isArray(rows[0].cases) ? rows[0].cases : JSON.parse(rows[0].cases);
      }
      return [];
    } catch (error) {
      logger.error('Error fetching user saved cases from DB:', error);
      throw error;
    }
  }

  async saveCasesForUser(identifier, cases) {
    if (!identifier) return [];
    const casesArray = Array.isArray(cases) ? cases : [];
    try {
      const sql = `
        INSERT INTO user_saved_cases (user_identifier, cases, updated_at)
        VALUES ($1, $2::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (user_identifier) DO UPDATE
        SET cases = EXCLUDED.cases, updated_at = CURRENT_TIMESTAMP
        RETURNING cases
      `;
      const { rows } = await query(sql, [String(identifier), JSON.stringify(casesArray)]);
      if (rows[0] && rows[0].cases) {
        return Array.isArray(rows[0].cases) ? rows[0].cases : JSON.parse(rows[0].cases);
      }
      return casesArray;
    } catch (error) {
      logger.error('Error saving user saved cases to DB:', error);
      throw error;
    }
  }

  async getSettings() {
    try {
      const sql = "SELECT value FROM settings WHERE key = 'platform_settings'";
      const { rows } = await query(sql);
      if (rows[0] && rows[0].value) {
        return typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
      }
      
      // Auto-initialize default settings in database if not present
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    } catch (error) {
      logger.error('Error retrieving settings from DB:', error);
      throw error;
    }
  }

  async saveSettings(settingsData) {
    try {
      const sql = `
        INSERT INTO settings (key, value, updated_at)
        VALUES ('platform_settings', $1::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE
        SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        RETURNING value
      `;
      const { rows } = await query(sql, [JSON.stringify(settingsData)]);
      if (rows[0] && rows[0].value) {
        return typeof rows[0].value === 'string' ? JSON.parse(rows[0].value) : rows[0].value;
      }
      return settingsData;
    } catch (error) {
      logger.error('Error saving settings to DB:', error);
      throw error;
    }
  }
}

export default new UserRepository();
