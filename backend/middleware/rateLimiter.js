import logger from '../utils/logger.js';

const resetRequestsMap = new Map();

// Periodically clean up expired rate limit records
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of resetRequestsMap.entries()) {
    if (now > data.resetTime) {
      resetRequestsMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

/**
 * Rate Limiter Middleware for Admin Password Reset
 * Limits requests to max 5 per 15 minutes per IP address
 */
export const forgotPasswordRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 5;

  let requestData = resetRequestsMap.get(ip);

  if (!requestData || now > requestData.resetTime) {
    requestData = { count: 1, resetTime: now + windowMs };
    resetRequestsMap.set(ip, requestData);
    return next();
  }

  if (requestData.count >= maxRequests) {
    logger.warn(`Rate limit exceeded for forgot password request from IP: ${ip}`);
    return res.status(429).json({
      status: 'error',
      message: 'Too many password reset requests. Please try again after 15 minutes.'
    });
  }

  requestData.count += 1;
  resetRequestsMap.set(ip, requestData);
  next();
};

const loginRequestsMap = new Map();

/**
 * Rate Limiter Middleware for Admin Login
 * Limits login attempts to max 10 per 15 minutes per IP address
 */
export const loginRateLimiter = (req, res, next) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const isDev = process.env.NODE_ENV !== 'production';
  const maxRequests = isDev ? 150 : 15;

  let requestData = loginRequestsMap.get(ip);

  if (!requestData || now > requestData.resetTime) {
    requestData = { count: 1, resetTime: now + windowMs };
    loginRequestsMap.set(ip, requestData);
    return next();
  }

  if (requestData.count >= maxRequests) {
    logger.warn(`Rate limit exceeded for login attempt from IP: ${ip}`);
    return res.status(429).json({
      status: 'error',
      message: 'Too many login attempts. Please try again after 15 minutes.'
    });
  }

  requestData.count += 1;
  loginRequestsMap.set(ip, requestData);
  next();
};
