/**
 * Configuration validation and management using Zod
 */

import { z } from 'zod';
import { logger } from './logger.js';

// Define the configuration schema
export const configSchema = z.object({
  // Server configuration
  port: z
    .string()
    .optional()
    .default('3000')
    .transform(val => parseInt(val, 10))
    .refine(port => port > 0 && port < 65536, {
      message: 'Port must be between 1 and 65535',
    }),

  // Node environment
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),

  // Logging configuration
  logLevel: z
    .enum(['error', 'warn', 'info', 'http', 'debug'])
    .default('info')
    .describe('Log level for Winston logger'),

  // Session management
  sessionMaxAge: z
    .string()
    .optional()
    .default('604800000') // 7 days in milliseconds
    .transform(val => parseInt(val, 10))
    .refine(age => age > 0, {
      message: 'Session max age must be positive',
    }),

  sessionCleanupInterval: z
    .string()
    .optional()
    .default('300000') // 5 minutes in milliseconds
    .transform(val => parseInt(val, 10))
    .refine(interval => interval > 0, {
      message: 'Session cleanup interval must be positive',
    }),

  // HTTP timeouts
  axiosTimeout: z
    .string()
    .optional()
    .default('30000') // 30 seconds
    .transform(val => parseInt(val, 10))
    .refine(timeout => timeout > 0, {
      message: 'Axios timeout must be positive',
    }),

  // Development options
  enableRequestLogging: z
    .string()
    .optional()
    .default('true')
    .transform(val => val.toLowerCase() === 'true'),

  enableDetailedErrors: z
    .string()
    .optional()
    .default('false')
    .transform(val => val.toLowerCase() === 'true'),
});

// Infer the TypeScript type from the schema
export type Config = z.infer<typeof configSchema>;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  const rawConfig = {
    port: process.env.PORT,
    nodeEnv: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL,
    sessionMaxAge: process.env.SESSION_MAX_AGE,
    sessionCleanupInterval: process.env.SESSION_CLEANUP_INTERVAL,
    axiosTimeout: process.env.AXIOS_TIMEOUT,
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING,
    enableDetailedErrors: process.env.ENABLE_DETAILED_ERRORS,
  };

  try {
    const config = configSchema.parse(rawConfig);
    logger.info('Configuration loaded successfully', {
      port: config.port,
      nodeEnv: config.nodeEnv,
      logLevel: config.logLevel,
      sessionMaxAge: `${config.sessionMaxAge}ms`,
      axiosTimeout: `${config.axiosTimeout}ms`,
      enableRequestLogging: config.enableRequestLogging,
      enableDetailedErrors: config.enableDetailedErrors,
    });
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('Configuration validation failed', {
        errors: error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      });
      throw new Error(
        `Configuration validation failed:\n${error.errors
          .map(err => `  - ${err.path.join('.')}: ${err.message}`)
          .join('\n')}`
      );
    }
    throw error;
  }
}

/**
 * Create an example .env file content
 */
export function generateEnvExample(): string {
  return `# GitLab MCP Server Configuration

# Server Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=info

# Session Management
SESSION_MAX_AGE=604800000
SESSION_CLEANUP_INTERVAL=300000

# HTTP Configuration
AXIOS_TIMEOUT=30000

# Development Options
ENABLE_REQUEST_LOGGING=true
ENABLE_DETAILED_ERRORS=false
`;
}

// Export a singleton config instance
export const config = loadConfig();
