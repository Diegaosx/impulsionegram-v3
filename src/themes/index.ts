// Theme registration.
//
// Importing this module registers every theme bundled in this build. To add a
// theme: create src/themes/<id>/ with a theme.ts that calls registerTheme(),
// then add one import line below. Routing and App.tsx stay untouched, and the
// admin selector picks the new theme up automatically via listThemes().

import './default/theme';
import './jap/theme';
import './glass/theme';

export { DEFAULT_THEME_ID, getTheme, listThemes, registerTheme, resolveThemeId } from './registry';
export type { ThemeDefinition, ThemeSlotName, ThemeSlots, ThemeSummary } from './types';
