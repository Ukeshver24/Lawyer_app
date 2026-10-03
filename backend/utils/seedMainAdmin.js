import bcrypt from 'bcrypt';
import { query } from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Seeder / Initializer for Permanent Main Admin Account in PostgreSQL
 * Seeded Email: kavinselvaraj12@gmail.com
 * Initial Password: Kavin1122 (Bcrypt Hashed)
 */
export const seedMainAdmin = async () => {
  const email = 'kavinselvaraj12@gmail.com';
  const initialPassword = 'Kavin1122';
  const role = 'MAIN_ADMIN';

  try {
    // 0. Ensure all required columns exist in users table
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS dob DATE;
    `);

    const password_hash = await bcrypt.hash(initialPassword, 10);

    // 1. Seed into PostgreSQL admins table
    const sqlAdmins = `
      INSERT INTO admins (name, username, email, password_hash, role)
      VALUES ('Main Admin', 'mainadmin', $1, $2, $3)
      ON CONFLICT (username) DO UPDATE 
      SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
    `;
    await query(sqlAdmins, [email, password_hash, role]);

    // 2. Seed into PostgreSQL users table for unified access
    const sqlUsers = `
      INSERT INTO users (name, mobile, email, password_hash, role)
      VALUES ('Main Admin', '9999999999', $1, $2, $3)
      ON CONFLICT (mobile) DO UPDATE 
      SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
    `;
    await query(sqlUsers, [email, password_hash, role]);

    logger.info(`Main Admin account (${email}) seeded/verified in PostgreSQL.`);
  } catch (err) {
    logger.error('Error seeding Main Admin account in PostgreSQL:', err.message);
  }
};
