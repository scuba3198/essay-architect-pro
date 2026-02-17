/**
 * Structured Logger using Pino.
 * RATIONALE: Centralized logging ensures consistency and allows for easy
 * integration with external observability tools if needed in the future.
 */
import pino from 'pino';

const isDev = import.meta.env.DEV;

/**
 * Global logger instance.
 * Injected into services via constructor injection to allow for easy mocking and testing.
 */
export const logger = pino({
  level: isDev ? 'debug' : 'info',
  browser: {
    asObject: true,
  },
  base: {
    env: isDev ? 'development' : 'production',
  },
});
