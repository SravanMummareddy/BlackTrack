import { createLogger, format, transports } from 'winston';

const isDev = process.env.NODE_ENV === 'development';

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  format: isDev
    ? format.combine(
        format.colorize(),
        format.timestamp({ format: 'HH:mm:ss' }),
        format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} ${level}: ${message}${metaStr}`;
        })
      )
    : format.combine(format.timestamp(), format.errors({ stack: true }), format.json()),
  transports: [new transports.Console()],
});

export function logError(message: string, err: unknown, context?: Record<string, unknown>) {
  logger.error(message, {
    ...context,
    err: err instanceof Error
      ? { message: err.message, stack: err.stack, name: err.name }
      : err,
  });
}
