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
        throw new Error('Secure random generation not available. Please use a modern browser over HTTPS.');
    }
    const array = new Uint8Array(bytes);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a UUID v4 compatible random identifier
 * @returns {string} UUID string
 * @throws {Error} If crypto API is unavailable (insecure context or old browser)
 */
export function generateUUID(): string {
    if (!window.crypto) {
        throw new Error('Secure random generation not available. Please use a modern browser over HTTPS.');
    }
    if (typeof window.crypto.randomUUID === 'function') {
        return window.crypto.randomUUID();
    }
    // Fallback for older browsers
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    const val6 = array[6];
    const val8 = array[8];
    if (val6 !== undefined) array[6] = (val6 & 0x0f) | 0x40; // Version 4
    if (val8 !== undefined) array[8] = (val8 & 0x3f) | 0x80; // Variant 10
    const hex = Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
    return [
        hex.slice(0, 8),
        hex.slice(8, 12),
        hex.slice(12, 16),
        hex.slice(16, 20),
        hex.slice(20, 32)
    ].join('-');
}

