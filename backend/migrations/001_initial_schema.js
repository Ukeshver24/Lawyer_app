import { query } from '../config/db.js';
import logger from '../utils/logger.js';

const runMigration = async () => {
  logger.info('Starting database migration: 001_initial_schema');

  try {
    // 1. Create Users Table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        mobile VARCHAR(15) NOT NULL UNIQUE,
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Users table created or verified.');

    // 2. Create Judgments Table
    await query(`
      CREATE TABLE IF NOT EXISTS judgments (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        court_name VARCHAR(150),
        judgment_date DATE,
        citation VARCHAR(100),
        petitioner_name VARCHAR(255),
        respondent_name VARCHAR(255),
        act_name VARCHAR(255),
        section_number VARCHAR(100),
        topics VARCHAR(255),
        head_note TEXT,
        content TEXT,
        pdf_file_path VARCHAR(255),
        search_vector TSVECTOR,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    logger.info('Judgments table created or verified.');

    // 3. Create GIN Index for Full Text Search
    // This allows lightning-fast search across lakhs of records
    await query(`
      CREATE INDEX IF NOT EXISTS judgments_search_idx 
      ON judgments USING GIN (search_vector)
    `);
    logger.info('GIN index on search_vector created or verified.');

    logger.info('Migration 001_initial_schema completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Migration failed!', error);
    process.exit(1);
  }
};

runMigration();
