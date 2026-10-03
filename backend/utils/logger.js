/**
 * Centralized Logger Utility
 * Replaces scattered console.log across the application.
 */

const getTimestamp = () => new Date().toISOString();

const logger = {
  info: (message, meta = {}) => {
    console.log(`[${getTimestamp()}] [INFO]: ${message}`, Object.keys(meta).length ? meta : '');
  },
  warn: (message, meta = {}) => {
    console.warn(`[${getTimestamp()}] [WARN]: ${message}`, Object.keys(meta).length ? meta : '');
  },
  error: (message, error = null) => {
    console.error(`[${getTimestamp()}] [ERROR]: ${message}`);
    if (error) {
      console.error(error.stack || error);
    }
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${getTimestamp()}] [DEBUG]: ${message}`, Object.keys(meta).length ? meta : '');
    }
  }
};

export default logger;
