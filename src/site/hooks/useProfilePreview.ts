// Instagram profile preview during checkout (RapidAPI integration).
//
// Headless: it owns the debounce, the request and the resulting status, so a
// theme only has to decide how to draw the card. When the integration is not
// configured the hook stays idle, so checkout is never blocked by it.

import { useEffect, useState } from 'react';
import { RapidProfile, fetchRapidApiProfile } from '../../utils/storage';

const DEBOUNCE_MS = 700;

export interface ProfilePreview {
  status: 'idle' | 'loading' | 'found' | 'notfound';
  profile: RapidProfile | null;
}

export interface ProfilePreviewInput {
  handle: string;   // what the client typed, with or without the leading @
  enabled: boolean; // only worth looking up for Instagram followers
}

export function useProfilePreview({ handle, enabled }: ProfilePreviewInput): ProfilePreview {
  const [preview, setPreview] = useState<ProfilePreview>({ status: 'idle', profile: null });

  useEffect(() => {
    if (!enabled) {
      setPreview({ status: 'idle', profile: null });
      return;
    }
    const clean = handle.trim().replace(/^@/, '');
    if (clean.length < 2) {
      setPreview({ status: 'idle', profile: null });
      return;
    }
    let cancelled = false;
    setPreview(p => ({ status: 'loading', profile: p.profile }));
    const timer = setTimeout(async () => {
      const res = await fetchRapidApiProfile(clean);
      if (cancelled) return;
      // Integration off → stay silent (no card), don't block the checkout.
      if (!res.configured) {
        setPreview({ status: 'idle', profile: null });
        return;
      }
      setPreview(res.profile ? { status: 'found', profile: res.profile } : { status: 'notfound', profile: null });
    }, DEBOUNCE_MS);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [handle, enabled]);

  return preview;
}
