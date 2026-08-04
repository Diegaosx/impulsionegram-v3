// Active-theme persistence.
//
// The authoritative value is GeneralSettings.theme from the server, but that
// only arrives after the boot fetch. We cache the last resolved id in
// localStorage so a returning visitor renders their theme on the first paint
// instead of flashing the default one and remounting.

const STORAGE_KEY = 'site_theme';

export function readCachedThemeId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Private mode / storage disabled — fall back to the default theme.
    return null;
  }
}

// Mirror the theme onto <html data-theme="..."> so per-theme CSS scopes apply.
export function markThemeOnDocument(themeId: string) {
  document.documentElement.dataset.theme = themeId;
}

// Commit a resolved theme id: state + cache. The <html data-theme> attribute is
// owned by a single effect in App so it stays in sync with the rendered theme.
export function applyThemeId(themeId: string, setThemeId: (id: string) => void) {
  setThemeId(themeId);
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Non-fatal: the theme still applies for this page view.
  }
}
