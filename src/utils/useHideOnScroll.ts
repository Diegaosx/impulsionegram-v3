import { useState, useEffect, useRef } from 'react';

// Returns whether the sticky header/promo bar should be hidden.
//
// Behavior:
//  - Always visible near the very top of the page.
//  - Hides when the user scrolls down (past a small threshold).
//  - Only reveals again after the user scrolls UP by more than `revealRatio`
//    of the viewport height (default 10%), so a tiny upward nudge at the bottom
//    of a page doesn't pop the header back in — the user has to "insist".
export function useHideOnScroll(revealRatio = 0.1): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  const upAccum = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastY.current;
      lastY.current = y;

      // Near the top: always show, reset the upward accumulator.
      if (y < 80) {
        upAccum.current = 0;
        setHidden(false);
        return;
      }

      if (delta > 0) {
        // Scrolling down — hide and reset upward progress.
        upAccum.current = 0;
        if (y > 120) setHidden(true);
      } else if (delta < 0) {
        // Scrolling up — require sustained upward movement before revealing.
        upAccum.current += -delta;
        if (upAccum.current > window.innerHeight * revealRatio) {
          setHidden(false);
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [revealRatio]);

  return hidden;
}
