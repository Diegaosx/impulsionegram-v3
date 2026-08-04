// Theme registry.
//
// Themes register themselves at import time (see src/themes/index.ts). The
// registry is the authority on which themes actually exist in this build, so it
// is also where an unknown/removed theme id is coerced back to the default —
// a stale value in the database can never white-screen the public site.

import { ThemeDefinition, ThemeSummary } from './types';

export const DEFAULT_THEME_ID = 'default';

const registry = new Map<string, ThemeDefinition>();

export function registerTheme(theme: ThemeDefinition): ThemeDefinition {
  registry.set(theme.id, theme);
  return theme;
}

// Returns the id when that theme is bundled in this build, else 'default'.
export function resolveThemeId(rawId?: string | null): string {
  const id = (rawId || '').trim();
  return id && registry.has(id) ? id : DEFAULT_THEME_ID;
}

export function getTheme(rawId?: string | null): ThemeDefinition {
  const theme = registry.get(resolveThemeId(rawId)) || registry.get(DEFAULT_THEME_ID);
  if (!theme) {
    // Only reachable if the default theme itself failed to register, which is a
    // build-time mistake rather than a runtime condition.
    throw new Error('No theme registered — src/themes/index.ts must register the default theme.');
  }
  return theme;
}

// Catalog for the admin selector: adding a theme makes it appear automatically.
export function listThemes(): ThemeSummary[] {
  return Array.from(registry.values())
    .map(({ id, label, description }) => ({ id, label, description }))
    .sort((a, b) => (a.id === DEFAULT_THEME_ID ? -1 : b.id === DEFAULT_THEME_ID ? 1 : a.label.localeCompare(b.label)));
}
