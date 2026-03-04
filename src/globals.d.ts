export {};

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
    fbq?: (command: string, action: string, params?: Record<string, unknown>) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    turnstile?: {
      render: (container: string | HTMLElement, options: TurnstileOptions) => string | null;
      execute: (id: string) => Promise<string> | string | void;
      reset: (id: string) => void;
      remove: (id: string) => void;
    };
  }
}
