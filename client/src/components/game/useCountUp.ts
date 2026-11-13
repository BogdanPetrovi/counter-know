"use client";

import { useEffect, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Counts from 0 up to `target` once, easing out. Shows `target` straight away when motion is reduced. */
export function useCountUp(target: number, { delayMs = 0, durationMs = 900 } = {}) {
  const [reduced] = useState(prefersReducedMotion);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (reduced) return;

    let frame = 0;
    const timeout = setTimeout(() => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, Math.max(0, (now - start) / durationMs));
        setValue(Math.round(target * (1 - (1 - t) ** 3)));
        if (t < 1) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frame);
    };
  }, [reduced, target, delayMs, durationMs]);

  return reduced ? target : value;
}
