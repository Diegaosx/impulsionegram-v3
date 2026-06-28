import { getIntegrations } from './db';

/**
 * Verify a reCAPTCHA v3 token against Google. Gated: if no secret key is
 * configured, verification is skipped (returns ok) so the site keeps working
 * until the admin enables reCAPTCHA.
 */
export async function verifyRecaptcha(
  token: string | undefined,
  remoteIp?: string
): Promise<{ ok: boolean; reason?: string }> {
  const integ = await getIntegrations();
  const secret = (integ.recaptchaSecretKey || '').trim();
  if (!secret) return { ok: true }; // not configured -> allow

  if (!token) return { ok: false, reason: 'missing-token' };

  const minScore = parseFloat(integ.recaptchaMinScore || '0.5') || 0.5;
  const params = new URLSearchParams({ secret, response: token });
  if (remoteIp) params.append('remoteip', remoteIp);

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    const data: any = await res.json();
    if (!data.success) return { ok: false, reason: 'failed' };
    if (typeof data.score === 'number' && data.score < minScore) {
      return { ok: false, reason: 'low-score' };
    }
    return { ok: true };
  } catch (e) {
    // On a verification outage, fail open so legit users aren't blocked.
    console.error('reCAPTCHA verification error:', e);
    return { ok: true, reason: 'verify-error' };
  }
}
