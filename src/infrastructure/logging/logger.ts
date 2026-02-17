import pino from 'pino';

const isDev = import.meta.env.DEV;

export const logger = pino({
  level: isDev ? 'debug' : 'info',
  browser: {
    asObject: true,
  },
  base: {
    env: isDev ? 'development' : 'production',
  },
});
