/**
 * Structured logging utility using Winston
 */

import winston from 'winston';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(colors);

// Create the logger configuration
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports based on environment
const transports: winston.transport[] = [
  // Console transport for all environments
  new winston.transports.Console({
    format: format,
  }),
];

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    })
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  transports,
  exitOnError: false,
});

// Create child loggers for different components
export const createComponentLogger = (component: string) => {
  return logger.child({ component });
};

// Convenience methods
export const apiLogger = createComponentLogger('GitLab-API');
export const sessionLogger = createComponentLogger('Session');
export const serverLogger = createComponentLogger('HTTP-Server');
export const authLogger = createComponentLogger('Auth');
