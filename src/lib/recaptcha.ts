'use client';

export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  '6LcO7qYtAAAAANUrfXfh0gmGbRRRkqefx1gtaisH';

/**
 * Ensures grecaptcha is loaded on the window object.
 */
function waitForGrecaptcha(timeoutMs: number = 8000): Promise<NonNullable<Window['grecaptcha']>> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('reCAPTCHA can only be executed in a browser environment.'));
    }

    if (window.grecaptcha) {
      return resolve(window.grecaptcha);
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      if (window.grecaptcha) {
        clearInterval(interval);
        resolve(window.grecaptcha);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(
          new Error(
            'Google reCAPTCHA script failed to load. Please disable ad-blockers and try again.'
          )
        );
      }
    }, 100);
  });
}

/**
 * Executes Google reCAPTCHA v3 with the given action name and returns the token.
 *
 * @param action - The name of the action (e.g., 'checkout', 'submit_order')
 * @returns Promise<string> - The generated reCAPTCHA verification token
 */
export async function executeRecaptcha(action: string = 'checkout'): Promise<string> {
  const siteKey = RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    throw new Error('reCAPTCHA site key is missing in configuration.');
  }

  const grecaptcha = await waitForGrecaptcha();

  return new Promise<string>((resolve, reject) => {
    grecaptcha.ready(async () => {
      try {
        const token = await grecaptcha.execute(siteKey, { action });
        if (!token) {
          throw new Error('reCAPTCHA token generation returned empty.');
        }
        resolve(token);
      } catch (err) {
        console.error('reCAPTCHA execution error:', err);
        reject(err instanceof Error ? err : new Error('Failed to execute reCAPTCHA.'));
      }
    });
  });
}

/**
 * Custom React Hook for executing reCAPTCHA v3
 */
export function useRecaptcha() {
  const execute = (action: string = 'checkout') => executeRecaptcha(action);
  return {
    executeRecaptcha: execute,
    siteKey: RECAPTCHA_SITE_KEY,
  };
}
