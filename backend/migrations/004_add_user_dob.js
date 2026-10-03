import { query } from '../config/db.js';
import logger from '../utils/logger.js';

const runMigration = async () => {
  logger.info('Starting database migration: 004_add_user_dob');

  try {
    await query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS dob DATE;
    `);

    logger.info('DOB column added to users table successfully.');
    logger.info('Migration 004_add_user_dob completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed!', error);
    process.exit(1);
  }
};

runMigration();
