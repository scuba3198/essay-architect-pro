/**
 * Cloudflare Turnstile Utility
 * Handles loading and rendering the Turnstile widget for anonymous user verification
 */

const TURNSTILE_SITE_KEY = '0x4AAAAAACKMj0SomqwjwY9E';
const TURNSTILE_SCRIPT_TIMEOUT_MS = 8000;
let turnstileScriptLoaded = false;
let turnstileScriptLoading = false;
let loadPromise = null;

/**
 * Load the Turnstile script if not already loaded
 */
export function loadTurnstileScript() {
    if (turnstileScriptLoaded) {
        return Promise.resolve();
    }

    if (turnstileScriptLoading && loadPromise) {
        return loadPromise;
    }

    turnstileScriptLoading = true;

    loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        let timeoutId = null;
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
export async function getTurnstileToken() {
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

        let widgetId = null;
        let timeoutId = null;

        const cleanup = () => {
            if (timeoutId) clearTimeout(timeoutId);
            if (widgetId !== null && window.turnstile) {
                try {
                    window.turnstile.remove(widgetId);
                } catch (e) {
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
                callback: (token) => {
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
                    if (execResult && typeof execResult.catch === 'function') {
                        execResult.catch(() => {
                            cleanup();
                            reject(new Error('Verification failed. Please try again.'));
                        });
                    }
                } catch (error) {
                    cleanup();
                    reject(error);
                }
            }
        } catch (error) {
            cleanup();
            reject(error);
        }
    });
}
