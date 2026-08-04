// Theme host: makes the active theme available to the public routes and renders
// a single slot from it.
//
// Routes reference slots by name, never by theme, so switching themes swaps the
// whole public site without any routing change.

import { ComponentProps, ComponentType, createContext, ReactNode, useContext, useMemo } from 'react';
import { getTheme, DEFAULT_THEME_ID } from '../themes/registry';
import { ThemeDefinition, ThemeSlotName, ThemeSlots } from '../themes/types';

const ThemeContext = createContext<ThemeDefinition>(getTheme(DEFAULT_THEME_ID));

export function ThemeProvider({ themeId, children }: { themeId?: string | null; children: ReactNode }) {
  // getTheme() coerces unknown ids back to the default, so a stale value in the
  // database renders the default theme instead of breaking the site.
  const theme = useMemo(() => getTheme(themeId), [themeId]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useActiveTheme(): ThemeDefinition {
  return useContext(ThemeContext);
}

type SlotProps<K extends ThemeSlotName> = ComponentProps<ThemeSlots[K]>;

// <ThemeSlot slot="Home" {...props} /> — props are type-checked against the slot.
//
// The data-theme wrapper is rendered here rather than stamped on <html> for two
// reasons. It scopes the theme's design tokens to the public site, so a theme
// with a different palette cannot repaint the admin panel or the client area
// (both use the same bg-primary/text-primary utilities but are deliberately
// out of theme scope). And because it is set during render instead of in an
// effect, the tokens are already correct on the first paint — the localStorage
// theme cache would otherwise still flash the previous palette.
export function ThemeSlot<K extends ThemeSlotName>({ slot, ...props }: { slot: K } & SlotProps<K>) {
  const theme = useActiveTheme();
  const Component = theme.slots[slot] as ComponentType<any>;
  return (
    <div data-theme={theme.id}>
      <Component {...props} />
    </div>
  );
}
