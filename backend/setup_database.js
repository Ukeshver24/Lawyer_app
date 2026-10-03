import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env or root .env
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const { Pool } = pg;

const dbConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'digi_law_reporter',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10)
    };

console.log('⚡ Connecting to PostgreSQL Database:', process.env.DATABASE_URL ? '(via DATABASE_URL)' : dbConfig.database);

const pool = new Pool(dbConfig);

const executeSqlFile = async (filePath) => {
  console.log(`📄 Executing SQL script: ${path.basename(filePath)}`);
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
};

const runDatabaseSetup = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Successfully connected to PostgreSQL Server!');
    client.release();

    // 1. Run Schema Migrations
    const schemaDir = path.join(__dirname, '../database/schema');
    const sqlFiles = fs.readdirSync(schemaDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of sqlFiles) {
      await executeSqlFile(path.join(schemaDir, file));
    }

    // 2. Run Seed Data
    const seedFile = path.join(__dirname, '../database/seed/seed_data.sql');
    if (fs.existsSync(seedFile)) {
      await executeSqlFile(seedFile);
    }

    console.log('🎉 Database Schema & Seed Data initialized successfully in PostgreSQL!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database Setup Failure:', error.message);
    console.error('👉 Make sure PostgreSQL server is running and credentials in backend/.env are correct.');
    process.exit(1);
  }
};

runDatabaseSetup();
