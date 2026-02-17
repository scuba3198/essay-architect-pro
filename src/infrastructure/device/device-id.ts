/**
 * Fingerprint Utility for Essay Architect
 * RATIONALE: Strictly for tracking free usage limits without user accounts.
 * Generates a stable ID based on the browser's hardware and software signature.
 */

import { Logger } from 'pino';

const DEVICE_ID_KEY = 'essay_architect_device_id';

declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

/**
 * Service for device identification and fingerprinting.
 */
export class DeviceService {
  constructor(private readonly logger: Logger) {}

  /**
   * Generates or retrieves a stable visitor ID.
   * @returns {Promise<string>} - The unique visitor ID
   */
  public async getVisitorID(): Promise<string> {
    // Check localStorage first for cached device ID
    const cachedId = localStorage.getItem(DEVICE_ID_KEY);
    if (cachedId) {
      return cachedId;
    }

    this.logger.debug('Generating new device fingerprint');

    // Generate new fingerprint if not cached
    const components: (string | number | undefined)[] = [
      navigator.userAgent,
      navigator.language,
      new Date().getTimezoneOffset(),
      `${window.screen.width}x${window.screen.height}`,
      window.screen.colorDepth,
      navigator.hardwareConcurrency,
      navigator.deviceMemory,
      // Canvas Fingerprinting
      this.getCanvasFingerprint(),
    ];

    const fingerprintString = components.join('###');

    // Hash the result for a clean ID
    const msgUint8 = new TextEncoder().encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // Cache in localStorage for consistency across tabs
    localStorage.setItem(DEVICE_ID_KEY, hashHex);

    this.logger.info({ deviceId: hashHex }, 'New device fingerprint generated');
    return hashHex;
  }

  /**
   * Generates a fingerprint using the HTML5 Canvas API.
   * RATIONALE: Provides an additional layer of uniqueness to the device ID.
   * @private
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return 'no-canvas';

      canvas.width = 200;
      canvas.height = 50;

      ctx.textBaseline = 'top';
      ctx.font = "14px 'Arial'";
      ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('EssayArchitect_Ghost_v1', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('EssayArchitect_Ghost_v1', 4, 17);

      return canvas.toDataURL();
    } catch (e) {
      this.logger.warn({ err: e }, 'Canvas fingerprinting failed');
      return 'canvas-err';
    }
  }
}
