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
export function ThemeSlot<K extends ThemeSlotName>({ slot, ...props }: { slot: K } & SlotProps<K>) {
  const theme = useActiveTheme();
  const Component = theme.slots[slot] as ComponentType<any>;
  return <Component {...props} />;
}
