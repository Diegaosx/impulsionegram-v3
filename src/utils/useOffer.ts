import { useEffect, useState } from 'react';
import { OfferConfig, fetchOffer } from './storage';

export interface OfferState {
  offer: OfferConfig | null;
  active: boolean;
  remaining: number | null; // seconds until the offer ends; null = no countdown
}

// Shared flash-offer hook: fetches the offer config once and keeps a live
// countdown to its end time, flipping `active` to false the moment it expires.
// Used by both the promo bar (to render) and the Header (to offset its top).
export function useOffer(): OfferState {
  const [offer, setOffer] = useState<OfferConfig | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchOffer().then((o) => { if (alive) setOffer(o); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!offer || !offer.active) { setRemaining(null); return; }
    if (!offer.endsAt) { setRemaining(null); setExpired(false); return; }
    const end = Date.parse(offer.endsAt);
    if (Number.isNaN(end)) { setRemaining(null); return; }
    const tick = () => {
      const left = Math.floor((end - Date.now()) / 1000);
      if (left <= 0) { setExpired(true); setRemaining(0); }
      else { setExpired(false); setRemaining(left); }
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [offer?.active, offer?.endsAt]);

  const active = !!offer && offer.active && !expired;
  return { offer, active, remaining };
}
