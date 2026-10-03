import { query } from '../config/db.js';
import logger from '../utils/logger.js';

const runMigration = async () => {
  logger.info('Starting database migration: 003_alter_citation_length');

  try {
    // Alter citation column to TEXT to accommodate multiple long citations
    await query(`
      ALTER TABLE judgments
      ALTER COLUMN citation TYPE TEXT;
    `);
    logger.info('Citation column altered to TEXT successfully.');

    logger.info('Migration 003_alter_citation_length completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed!', error);
    process.exit(1);
  }
};

runMigration();
