import { Data } from 'effect';

/**
 * Base Application Error class.
 * All domain-specific errors should extend this class.
 */
export class AppError extends Data.TaggedError('AppError')<{
  readonly message: string;
  readonly code: string;
  readonly shouldLog: boolean;
}> {
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
