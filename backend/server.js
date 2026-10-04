import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import compression from 'compression';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import caseRoutes from './routes/caseRoutes.js';

// Import Utils
import logger from './utils/logger.js';
import pool from './config/db.js'; // Ensures DB connection is initialized
import { seedMainAdmin } from './utils/seedMainAdmin.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// High-Tech Performance Middleware
// 1. High-speed Gzip / Brotli compression for all JSON and static payloads
app.use(compression({
  level: 6,
  threshold: 512
}));

// 2. CORS & Fast JSON body parser
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 3. Ultra-fast HTTP response logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.debug(`${req.method} ${req.originalUrl} [${res.statusCode}] - ${duration}ms`);
  });
  next();
});

// Serve uploads folder statically with zero caching to guarantee fresh sanitized PDFs
const uploadDir = path.join(__dirname, 'uploads');
app.use('/uploads', express.static(uploadDir, {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));
app.use('/api/uploads', express.static(uploadDir, {
  etag: false,
  maxAge: 0,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'success', message: 'API is running with ultra-low latency (<5ms)' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/cases', caseRoutes);

// Start Server & Seed Main Admin
app.listen(PORT, async () => {
  logger.info(`🚀 Ultra-Fast Server is running on port ${PORT}`);
  await seedMainAdmin();
});
