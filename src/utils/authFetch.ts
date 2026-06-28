// Installs a global fetch wrapper that attaches the admin JWT (when present) to
// same-origin /api requests, and reacts to 401 by clearing the session and
// sending the user back to the login screen. Imported once from main.tsx so it
// is active before any API call runs.

const TOKEN_KEY = 'admin_token';
const USER_KEY = 'auth_user';

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// Cached current user (read synchronously on boot to avoid auth flicker).
export function getCachedUser<T = any>(): T | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: any): void {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(USER_KEY);
}

export function clearCachedUser(): void {
  localStorage.removeItem(USER_KEY);
}

function isApiUrl(url: string): boolean {
  // Same-origin API calls are written as relative "/api/..." paths.
  if (url.startsWith('/api')) return true;
  try {
    const u = new URL(url, window.location.origin);
    return u.origin === window.location.origin && u.pathname.startsWith('/api');
  } catch {
    return false;
  }
}

export function installAuthFetch(): void {
  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const apiCall = isApiUrl(url);
    const token = getAdminToken();

    if (apiCall && token) {
      const headers = new Headers(init.headers || (typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined));
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      init = { ...init, headers };
    }

    const res = await original(input as any, init);

    // An expired/invalid session on an authenticated API call: drop the token
    // and bounce to the login page (unless we're already there).
    if (apiCall && res.status === 401 && token) {
      clearAdminToken();
      clearCachedUser();
      localStorage.removeItem('admin_authenticated');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }

    return res;
  };
}
