// frontend/src/utils/logger.js
// Frontend logging utility - Simple console wrapper
// This ensures all frontend logging works consistently

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = {
  // Info level logging
  info: (message, ...args) => {
    if (isDevelopment) {
      console.log(`🔷 [INFO]`, message, ...args);
    } else {
      console.log(message, ...args);
    }
  },

  // Debug level logging (only in development)
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.log(`🔧 [DEBUG]`, message, ...args);
    }
    // Silent in production
  },

  // Error logging (always visible)
  error: (message, ...args) => {
    console.error(`❌ [ERROR]`, message, ...args);
  },

  // Warning logging
  warn: (message, ...args) => {
    console.warn(`⚠️ [WARN]`, message, ...args);
  },

  // General logging
  log: (message, ...args) => {
    console.log(message, ...args);
  },

  // Success logging
  success: (message, ...args) => {
    if (isDevelopment) {
      console.log(`✅ [SUCCESS]`, message, ...args);
    } else {
      console.log(message, ...args);
    }
  }
};

// Export as default for ES6 imports
export default logger;

// Also export as named export for flexibility
export { logger };

/**
 * USAGE EXAMPLES:
 * 
 * import logger from '../utils/logger';
 * 
 * logger.info('Game started successfully');
 * logger.debug('Player data:', playerData);
 * logger.error('Failed to connect:', error);
 * logger.warn('Connection unstable');
 * logger.success('Move completed!');
 */