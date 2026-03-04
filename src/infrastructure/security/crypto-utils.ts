import { Effect } from 'effect';
import { AppError } from '../../domain/error';

/**
 * Generate a cryptographically secure random token
 * @param {number} bytes - Number of random bytes (default 32 = 64 hex chars)
 * @returns {Effect.Effect<string, AppError>} Hex-encoded random token
 */
export const generateSecureToken = (bytes: number = 32): Effect.Effect<string, AppError> => {
  if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') {
    return Effect.fail(
      new AppError({
        code: 'SESSION_ERROR',
        message: 'Secure random generation not available. Please use a modern browser over HTTPS.',
      }),
    );
  }
  return Effect.sync(() => {
    const array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
  });
};
