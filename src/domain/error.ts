/**
 * Base Application Error class.
 * All domain-specific errors should extend this class.
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly shouldLog: boolean;

  constructor(message: string, code: string = 'INTERNAL_ERROR', shouldLog: boolean = true) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.shouldLog = shouldLog;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
