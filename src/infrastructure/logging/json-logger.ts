/**
 * Effect JSON Logger Layer
 *
 * Replaces Effect's default pretty-printer with a machine-readable JSON logger.
 * Satisfies the structured logging requirement:
 *   - timestamp (ISO 8601)
 *   - level
 *   - service
 *   - message
 *   - all annotations (correlationId, userId, operation, etc.) spread at top level
 *
 * USAGE: provide JsonLoggerLayer when running any Effect program.
 */

import { Logger, Layer, LogLevel, HashMap } from 'effect';

const SERVICE_NAME = 'essay-architect-pro';

/**
 * A logger that emits one JSON object per log line to the console.
 * In a browser context this appears in DevTools; in a server context it is
 * machine-parseable by any log aggregator reading stdout.
 */
const JsonLogger = Logger.make<unknown, void>(({ logLevel, message, annotations, date, cause }) => {
  const record: Record<string, unknown> = {
    timestamp: date.toISOString(),
    level: logLevel.label,
    service: SERVICE_NAME,
    message: Array.isArray(message) ? message.join(' ') : String(message),
  };

  // Spread fiber-local annotations (correlationId, userId, operation, etc.)
  HashMap.toEntries(annotations).forEach(([key, value]) => {
    record[key] = value;
  });

  // Include cause if present (Effect error channel value)
  if (cause !== undefined) {
    record['cause'] = String(cause);
  }

  console.log(JSON.stringify(record));
});

/**
 * Effect Layer that replaces the default logger with the JSON logger.
 * Only emit INFO and above in production; DEBUG in development.
 */
export const JsonLoggerLayer = Logger.replace(Logger.defaultLogger, JsonLogger).pipe(
  Layer.merge(Logger.minimumLogLevel(import.meta.env.DEV ? LogLevel.Debug : LogLevel.Info)),
);
