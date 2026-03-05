import { Schema } from '@effect/schema';

/**
 * Base Application Error class.
 *
 * Uses Schema.TaggedError so errors are serializable and type-safe while
 * preserving the existing constructor ergonomics used throughout the app.
 */
export class AppError extends Schema.TaggedError<AppError>()(
  'AppError',
  {
    message: Schema.String,
    code: Schema.String,
    shouldLog: Schema.Boolean,
  },
) {
  constructor(
    args: { message: string; code?: string; shouldLog?: boolean } | string,
    code?: string,
    shouldLog?: boolean,
  ) {
    if (typeof args === 'string') {
      super({ message: args, code: code ?? 'INTERNAL_ERROR', shouldLog: shouldLog ?? true });
    } else {
      super({
        message: args.message,
        code: args.code ?? 'INTERNAL_ERROR',
        shouldLog: args.shouldLog ?? true,
      });
    }
  }
}
