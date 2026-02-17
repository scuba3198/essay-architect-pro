/**
 * Cloudflare Turnstile Utility
 * Handles loading and rendering the Turnstile widget for anonymous user verification
 */

interface TurnstileOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  size?: 'normal' | 'flexible' | 'compact' | 'invisible';
  theme?: 'light' | 'dark' | 'auto';
  action?: string;
  cData?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string | null;
      remove: (id: string) => void;
      execute: (id: string) => Promise<void> | void;
    };
  }
}

const TURNSTILE_SITE_KEY = '0x4AAAAAACKMj0SomqwjwY9E';
const TURNSTILE_SCRIPT_TIMEOUT_MS = 8000;
let turnstileScriptLoaded = false;
let turnstileScriptLoading = false;
let loadPromise: Promise<void> | null = null;

/**
 * Load the Turnstile script if not already loaded
 */
export function loadTurnstileScript(): Promise<void> {
  if (turnstileScriptLoaded) {
    return Promise.resolve();
  }

  if (turnstileScriptLoading && loadPromise) {
    return loadPromise;
  }

  turnstileScriptLoading = true;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      script.onload = null;
      script.onerror = null;
    };

    timeoutId = setTimeout(() => {
      cleanup();
      turnstileScriptLoading = false;
      reject(new Error('Turnstile script load timed out.'));
    }, TURNSTILE_SCRIPT_TIMEOUT_MS);

    script.onload = () => {
      cleanup();
      if (!window.turnstile || typeof window.turnstile.render !== 'function') {
        turnstileScriptLoading = false;
        reject(new Error('Turnstile failed to initialize.'));
        return;
      }
      turnstileScriptLoaded = true;
      turnstileScriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      cleanup();
      turnstileScriptLoading = false;
      reject(new Error('Failed to load Turnstile script'));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}

/**
 * Get a Turnstile token for anonymous API verification
 * Creates an invisible widget, gets the token, and cleans up
 * @returns {Promise<string>} The Turnstile token
 */
export async function getTurnstileToken(): Promise<string> {
  await loadTurnstileScript();

  return new Promise((resolve, reject) => {
    if (!window.turnstile || typeof window.turnstile.render !== 'function') {
      reject(new Error('Turnstile is not available.'));
      return;
    }

    // Create a hidden container for the widget
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    let widgetId: string | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (widgetId !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetId);
        } catch {
          // Ignore cleanup errors
        }
      }
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };

    // Timeout after 30 seconds
    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error('Turnstile verification timed out. Please try again.'));
    }, 30000);

    try {
      widgetId = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => {
          cleanup();
          resolve(token);
        },
        'error-callback': () => {
          cleanup();
          reject(new Error('Verification failed. Please try again.'));
        },
        'expired-callback': () => {
          cleanup();
          reject(new Error('Verification expired. Please try again.'));
        },
        size: 'invisible',
      });

      if (typeof window.turnstile.execute === 'function' && widgetId !== null) {
        try {
          const execResult = window.turnstile.execute(widgetId);
          if (execResult instanceof Promise) {
            execResult.catch(() => {
              cleanup();
              reject(new Error('Verification failed. Please try again.'));
            });
          }
        } catch (error) {
          cleanup();
          reject(error as Error);
        }
      }
    } catch (error) {
      cleanup();
      reject(error as Error);
    }
  });
}
