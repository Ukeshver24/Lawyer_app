import { query } from './config/db.js';
import logger from './utils/logger.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const mockUsers = [
  { name: 'Ramesh Kumar', mobile: '9876543210', email: 'ramesh.k@example.com' },
  { name: 'Priya Sharma', mobile: '9123456789', email: 'priya.s@example.com' },
  { name: 'Karthik Raja', mobile: '9988776655', email: 'karthik.r@example.com' },
  { name: 'Anjali Verma', mobile: '9456123780', email: 'anjali.v@example.com' },
  { name: 'Mohammed Ali', mobile: '9871234560', email: 'mohammed.a@example.com' }
];

async function seedUsers() {
  try {
    // 1. Seed Super Admin
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      logger.info('Seeding SUPER_ADMIN...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const adminSql = `
        INSERT INTO users (name, mobile, email, password_hash, role) 
        VALUES ($1, $2, $3, $4, $5) 
        ON CONFLICT (mobile) DO UPDATE 
        SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, email = EXCLUDED.email
      `;
      // We need a unique mobile for the admin to satisfy the UNIQUE constraint, using a placeholder if none provided
      await query(adminSql, ['Super Admin', '0000000000', adminEmail, hashedPassword, 'SUPER_ADMIN']);
      logger.info('SUPER_ADMIN seeded successfully!');
    } else {
      logger.warn('SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not found in .env. Skipping admin seed.');
    }

    // 2. Seed Mock Users
    logger.info('Inserting mock users...');
    for (const user of mockUsers) {
      try {
        await query('INSERT INTO users (name, mobile, email, role) VALUES ($1, $2, $3, $4) ON CONFLICT (mobile) DO NOTHING', [user.name, user.mobile, user.email, 'USER']);
      } catch (err) {
        logger.error(`Error inserting user ${user.name}`, err);
      }
    }
    
    logger.info('Mock users added successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
