import { fetchPublicConfig } from './storage';

// Lazily loads the reCAPTCHA v3 script using the configured site key and
// returns an execution token for a given action. If reCAPTCHA isn't configured
// (no site key), it resolves to null and the flow continues unprotected.
let siteKey: string | undefined;
let scriptPromise: Promise<void> | null = null;

async function ensureLoaded(): Promise<string> {
  if (siteKey === undefined) {
    const cfg = await fetchPublicConfig();
    siteKey = cfg.recaptchaSiteKey || '';
  }
  if (!siteKey) return '';
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector('script[data-recaptcha="v3"]');
      if (existing) { resolve(); return; }
      const s = document.createElement('script');
      s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
      s.async = true;
      s.defer = true;
      s.setAttribute('data-recaptcha', 'v3');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('failed to load recaptcha'));
      document.head.appendChild(s);
    });
  }
  await scriptPromise;
  return siteKey;
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  try {
    const key = await ensureLoaded();
    if (!key) return null;
    const grecaptcha = (window as any).grecaptcha;
    if (!grecaptcha) return null;
    return await new Promise<string | null>((resolve) => {
      grecaptcha.ready(() => {
        grecaptcha.execute(key, { action }).then(resolve).catch(() => resolve(null));
      });
    });
  } catch {
    return null;
  }
}
