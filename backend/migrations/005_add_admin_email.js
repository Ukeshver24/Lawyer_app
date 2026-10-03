import { query } from '../config/db.js';
import logger from '../utils/logger.js';

const runMigration = async () => {
  logger.info('Starting database migration: 005_add_admin_email');

  try {
    await query(`
      ALTER TABLE admins
      ADD COLUMN IF NOT EXISTS email VARCHAR(100);
    `);

    logger.info('Email column added to admins table successfully.');
    logger.info('Migration 005_add_admin_email completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed!', error);
    process.exit(1);
  }
};

runMigration();
