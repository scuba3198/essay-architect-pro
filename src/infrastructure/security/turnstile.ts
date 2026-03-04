/**
 * Cloudflare Turnstile Utility
 * Handles loading and rendering the Turnstile widget for anonymous user verification
 */

import { Effect, Cause } from 'effect';
import { AppError } from '../../domain/error';

const TURNSTILE_SITE_KEY = '0x4AAAAAACKMj0SomqwjwY9E';

/**
 * Load the Turnstile script.
 * Resolves immediately if already available.
 */
const loadTurnstileScript = Effect.async<void, AppError>((resume) => {
  if (window.turnstile && typeof window.turnstile.render === 'function') {
    resume(Effect.succeed(void 0));
    return;
  }

  // Check if currently loading to prevent duplicates
  if (document.querySelector('script[src*="cloudflare.com/turnstile"]')) {
    // Poll until window.turnstile is available
    const interval = setInterval(() => {
      if (window.turnstile && typeof window.turnstile.render === 'function') {
        clearInterval(interval);
        resume(Effect.succeed(void 0));
      }
    }, 100);

    return Effect.sync(() => clearInterval(interval));
  }

  const script = document.createElement('script');
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async = true;
  script.defer = true;

  script.onload = () => {
    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      resume(
        Effect.fail(
          new AppError({
            message: 'Turnstile failed to initialize.',
            code: 'TURNSTILE_INIT_ERROR',
          }),
        ),
      );
      return;
    }
    resume(Effect.succeed(void 0));
  };

  script.onerror = () => {
    resume(
      Effect.fail(
        new AppError({ message: 'Failed to load Turnstile script', code: 'TURNSTILE_LOAD_ERROR' }),
      ),
    );
  };

  document.head.appendChild(script);

  return Effect.sync(() => {
    script.onload = null;
    script.onerror = null;
  });
}).pipe(
  Effect.timeout('8 seconds'),
  Effect.mapError((e) =>
    Cause.isTimeoutException(e)
      ? new AppError({ message: 'Turnstile script load timed out.', code: 'TURNSTILE_TIMEOUT' })
      : e,
  ),
);

/**
 * Get a Turnstile token for anonymous API verification
 * Creates an invisible widget, gets the token, and cleans up
 * @returns {Effect.Effect<string, AppError>} The Turnstile token
 */
export const getTurnstileToken = (): Effect.Effect<string, AppError> =>
  Effect.gen(function* () {
    yield* loadTurnstileScript;

    return yield* Effect.async<string, AppError>((resume) => {
      if (!window.turnstile || typeof window.turnstile.render !== 'function') {
        resume(
          Effect.fail(
            new AppError({ message: 'Turnstile is not available.', code: 'TURNSTILE_UNAVAILABLE' }),
          ),
        );
        return;
      }

      // Create a hidden container for the widget
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      document.body.appendChild(container);

      const widgetId = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          resume(Effect.succeed(token));
        },
        'error-callback': () => {
          resume(
            Effect.fail(
              new AppError({
                message: 'Verification failed. Please try again.',
                code: 'TURNSTILE_VERIFY_ERROR',
              }),
            ),
          );
        },
        'expired-callback': () => {
          resume(
            Effect.fail(
              new AppError({
                message: 'Verification expired. Please try again.',
                code: 'TURNSTILE_EXPIRED',
              }),
            ),
          );
        },
      });

      // We rely on auto-execution (which is default). No need to call window.turnstile.execute()
      // manually as that throws 'already executing' errors for visible/managed widget types.

      // Cleanup mechanism that Effect runs if interrupted or finished
      return Effect.sync(() => {
        if (widgetId !== null && window.turnstile) {
          Effect.runSync(
            Effect.try({
              try: () => window.turnstile?.remove(widgetId),
              catch: () => void 0,
            }).pipe(Effect.catchAll(() => Effect.succeed(void 0))),
          );
        }
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      });
    }).pipe(
      Effect.timeout('30 seconds'),
      Effect.mapError((e) =>
        Cause.isTimeoutException(e)
          ? new AppError({
              message: 'Bot verification timed out. Please try again.',
              code: 'TURNSTILE_TIMEOUT',
            })
          : e,
      ),
    );
  });
