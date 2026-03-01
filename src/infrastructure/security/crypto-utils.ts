/**
 * Cryptographic Utilities
 * Provides secure random token generation for session management
 */

/**
 * Generate a cryptographically secure random token
 * @param {number} bytes - Number of random bytes (default 32 = 64 hex chars)
 * @returns {string} Hex-encoded random token
 * @throws {Error} If crypto API is unavailable (insecure context or old browser)
 */
export function generateSecureToken(bytes: number = 32): string {
  if (!window.crypto || typeof window.crypto.getRandomValues !== 'function') {
    throw new Error(
      'Secure random generation not available. Please use a modern browser over HTTPS.',
    );
  }
  const array = new Uint8Array(bytes);
  window.crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
