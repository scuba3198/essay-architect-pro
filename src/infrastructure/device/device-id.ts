/**
 * Fingerprint Utility for Essay Architect
 * RATIONALE: Strictly for tracking free usage limits without user accounts.
 * Generates a stable ID based on the browser's hardware and software signature.
 */

const DEVICE_ID_KEY = 'essay_architect_device_id';

declare global {
  interface Navigator {
    deviceMemory?: number;
  }
}

import { Effect } from 'effect';
import { AppError } from '../../domain/error';

/**
 * Service for device identification and fingerprinting.
 */
export class DeviceService {
  /**
   * Generates or retrieves a stable visitor ID.
   * @returns {Effect.Effect<string, AppError>} - The unique visitor ID
   */
  public getVisitorID(): Effect.Effect<string, AppError> {
    const program = Effect.gen(this, function* () {
      // Check localStorage first for cached device ID
      const cachedId = yield* Effect.try({
        try: () => localStorage.getItem(DEVICE_ID_KEY),
        catch: (e) =>
          new AppError({
            message: `LocalStorage read failed: ${e}`,
            code: 'STORAGE_ERROR',
            shouldLog: true,
          }),
      }).pipe(Effect.catchAll(() => Effect.succeed(null)));

      if (cachedId) {
        return cachedId;
      }

      yield* Effect.logDebug('Generating new device fingerprint');

      const canvasFingerprint = yield* this.getCanvasFingerprint();

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
        canvasFingerprint,
      ];

      const fingerprintString = components.join('###');

      // Hash the result for a clean ID
      const msgUint8 = new TextEncoder().encode(fingerprintString);
      const hashBuffer = yield* Effect.tryPromise({
        try: () => crypto.subtle.digest('SHA-256', msgUint8),
        catch: (e) =>
          new AppError({
            message: `Crypto digest failed: ${e}`,
            code: 'CRYPTO_ERROR',
            shouldLog: true,
          }),
      });

      const hashArray = Array.from(new Uint8Array(hashBuffer as ArrayBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // Cache in localStorage for consistency across tabs
      yield* Effect.try({
        try: () => localStorage.setItem(DEVICE_ID_KEY, hashHex),
        catch: (e) =>
          new AppError({
            message: `LocalStorage write failed: ${e}`,
            code: 'STORAGE_ERROR',
            shouldLog: true,
          }),
      }).pipe(Effect.catchAll(() => Effect.succeed(void 0)));

      yield* Effect.logInfo('New device fingerprint generated', { deviceId: hashHex });
      return hashHex;
    });

    return program.pipe(Effect.annotateLogs({ service: 'DeviceService' }));
  }

  /**
   * Generates a fingerprint using the HTML5 Canvas API.
   * RATIONALE: Provides an additional layer of uniqueness to the device ID.
   * @private
   */
  private getCanvasFingerprint(): Effect.Effect<string, never> {
    return Effect.try({
      try: () => {
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
      },
      catch: (e) => {
        return e;
      },
    }).pipe(
      Effect.tapError((e) => Effect.logWarning('Canvas fingerprinting failed', { error: e })),
      Effect.catchAll(() => Effect.succeed('canvas-err')),
    );
  }
}
