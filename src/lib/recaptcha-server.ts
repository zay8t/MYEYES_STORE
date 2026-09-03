export interface RecaptchaVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  challenge_ts?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export interface VerifyRecaptchaResult {
  success: boolean;
  score?: number;
  action?: string;
  error?: string;
  isBot?: boolean;
}

/**
 * Server-side verification function for Google reCAPTCHA v3.
 *
 * @param token - The response token sent from the client
 * @param expectedAction - The action expected (e.g. 'checkout')
 * @param minScore - Minimum acceptable score (defaults to 0.5)
 */
export async function verifyRecaptchaToken(
  token: string | undefined | null,
  expectedAction: string = 'checkout',
  minScore: number = 0.5
): Promise<VerifyRecaptchaResult> {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return {
      success: false,
      error: 'reCAPTCHA token is required.',
      isBot: false,
    };
  }

  const secretKey =
    process.env.RECAPTCHA_SECRET_KEY ||
    '6LcO7qYtAAAAAJ2d1WmrTj253n4UmJoBtN9xusMo';

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is missing in server environment.');
    return {
      success: false,
      error: 'reCAPTCHA secret key configuration missing.',
      isBot: false,
    };
  }

  try {
    const postBody = new URLSearchParams({
      secret: secretKey,
      response: token.trim(),
    });

    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: postBody.toString(),
      cache: 'no-store',
    });

    if (!verifyRes.ok) {
      console.error(
        `reCAPTCHA siteverify endpoint responded with HTTP ${verifyRes.status}`
      );
      return {
        success: false,
        error: 'Failed to contact reCAPTCHA verification service.',
        isBot: false,
      };
    }

    const data: RecaptchaVerifyResponse = await verifyRes.json();

    if (!data.success) {
      console.warn('reCAPTCHA verification reported failure:', data['error-codes']);
      return {
        success: false,
        error: 'Automated activity detected. Order rejected.',
        isBot: true,
      };
    }

    if (typeof data.score === 'number' && data.score < minScore) {
      console.warn(
        `reCAPTCHA low score detected: ${data.score} (threshold: ${minScore})`
      );
      return {
        success: false,
        score: data.score,
        error: 'Automated activity detected. Order rejected.',
        isBot: true,
      };
    }

    if (expectedAction && data.action && data.action !== expectedAction) {
      console.warn(
        `reCAPTCHA action mismatch: expected '${expectedAction}', received '${data.action}'`
      );
      return {
        success: false,
        action: data.action,
        error: 'reCAPTCHA action validation mismatch.',
        isBot: true,
      };
    }

    return {
      success: true,
      score: data.score,
      action: data.action,
      isBot: false,
    };
  } catch (err) {
    console.error('Error verifying reCAPTCHA token:', err);
    return {
      success: false,
      error: 'An internal error occurred during security validation.',
      isBot: false,
    };
  }
}
