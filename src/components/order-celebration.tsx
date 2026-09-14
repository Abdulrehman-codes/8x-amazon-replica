"use client";

import { useEffect, useRef } from "react";

/**
 * Fires once when an order lands on its confirmation page.
 *
 * The library is imported lazily so ~7KB of confetti never reaches the other
 * 99% of visits that are not a successful checkout.
 */
export function OrderCelebration() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;

    import("canvas-confetti")
      .then(({ default: confetti }) => {
        if (cancelled) return;

        const brand = ["#f5a524", "#00707d", "#067d62", "#e0553a", "#1b2836"];

        // Two angled bursts from the lower corners read as celebration;
        // a single centre burst reads as an error state.
        confetti({
          particleCount: 70,
          spread: 62,
          origin: { x: 0.15, y: 0.75 },
          angle: 60,
          colors: brand,
          disableForReducedMotion: true,
        });
        confetti({
          particleCount: 70,
          spread: 62,
          origin: { x: 0.85, y: 0.75 },
          angle: 120,
          colors: brand,
          disableForReducedMotion: true,
        });
        setTimeout(() => {
          if (cancelled) return;
          confetti({
            particleCount: 45,
            spread: 100,
            origin: { y: 0.5 },
            colors: brand,
            disableForReducedMotion: true,
          });
        }, 220);
      })
      .catch(() => {
        // Confetti is decoration; failing to load it must change nothing.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
