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

// Commit a resolved theme id: state + cache. The data-theme attribute itself is
// rendered by ThemeSlot, so it is applied on the first paint and stays scoped to
// the public site.
export function applyThemeId(themeId: string, setThemeId: (id: string) => void) {
  setThemeId(themeId);
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    // Non-fatal: the theme still applies for this page view.
  }
}
