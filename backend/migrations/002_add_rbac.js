import { query } from '../config/db.js';
import logger from '../utils/logger.js';

const runMigration = async () => {
  logger.info('Starting database migration: 002_add_rbac');

  try {
    // Modify users table
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
      ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'USER',
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_login TIMESTAMP,
      ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES users(id)
    `);

    logger.info('Users table successfully updated with RBAC columns.');
    logger.info('Migration 002_add_rbac completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed!', error);
    process.exit(1);
  }
};

runMigration();
