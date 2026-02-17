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

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', false);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', false);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND', false);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network request failed') {
    super(message, 'NETWORK_ERROR', true);
  }
}
