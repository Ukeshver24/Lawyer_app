import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const { Pool, types } = pkg;

// Force PostgreSQL DATE (OID 1082) to return exact raw string 'YYYY-MM-DD' without UTC timezone shifts
types.setTypeParser(1082, (str) => str);

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 }
  : {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'digi_law_reporter',
      password: process.env.DB_PASSWORD || 'postgres',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    };

export const pool = new Pool(poolConfig);

pool.connect()
  .then(client => {
    client.release();
    logger.info('PostgreSQL Database Connected Successfully.');
  })
  .catch(err => {
    logger.error('PostgreSQL Database Connection Error:', err.message);
  });

pool.on('connect', () => {
  logger.debug('New connection established with PostgreSQL database.');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL Pool Error:', err.message);
});

// Helper for single queries
export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (err) {
    logger.error(`Error executing query: ${text}`, err);
    throw err;
  }
};

// Helper for transactions
export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;

  const timeout = setTimeout(() => {
    logger.error('A client has been checked out for more than 5 seconds!');
    logger.error(`The last executed query on this client was: ${client.lastQuery}`);
  }, 5000);

  client.query = (...args) => {
    client.lastQuery = args;
    return query.apply(client, args);
  };

  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };

  return client;
};

export default pool;
