import { useEffect, useState } from 'react';
import { fetchGeneralSettings } from './storage';

// Whether the "Nossos Planos" section is enabled. Defaults to true (shown)
// until the setting loads, so the section never flickers off for everyone.
export function usePlansEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => {
    let alive = true;
    fetchGeneralSettings()
      .then((g) => { if (alive) setEnabled(g?.plansEnabled !== false); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return enabled;
}
