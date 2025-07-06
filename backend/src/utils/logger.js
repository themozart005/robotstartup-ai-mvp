// backend/src/utils/logger.js
// Logging utility for debugging and monitoring
// This helps track what's happening in the server for troubleshooting

const winston = require('winston');
const path = require('path');

// Create logs directory if it doesn't exist
const fs = require('fs');
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write to console in development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // Write to file for production
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, also log to console with colors
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp }) => {
        return `${timestamp} ${level}: ${message}`;
      })
    )
  }));
}

module.exports = logger;

/**
 * EXPLANATION FOR BEGINNERS:
 * 
 * This logger utility helps us track what's happening in our server:
 * 
 * 1. DIFFERENT LOG LEVELS:
 *    - ERROR: Something went wrong that needs attention
 *    - WARN: Something unusual happened but not critical
 *    - INFO: General information about what's happening
 *    - DEBUG: Detailed information for troubleshooting
 * 
 * 2. WHERE LOGS GO:
 *    - Console: Shows in terminal while developing
 *    - Files: Saves to disk for production monitoring
 *    - Different files for different severity levels
 * 
 * 3. LOG ROTATION:
 *    - Automatically creates new log files when they get too big
 *    - Keeps only the most recent 5 files to save disk space
 * 
 * 4. USAGE EXAMPLES:
 *    - logger.info('Game created successfully')
 *    - logger.error('Database connection failed', error)
 *    - logger.warn('Player took longer than expected to move')
 * 
 * This is essential for debugging issues and monitoring the health
 * of your application in production.
 */