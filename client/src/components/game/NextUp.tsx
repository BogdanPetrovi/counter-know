"use client";

import { delay } from "./animation";
import { CountdownBar } from "./CountdownBar";
import { useCountdown } from "./useCountdown";

export interface NextUpProps {
  /** What comes after the break, e.g. "Final round". */
  label: string;
  /** Local `Date.now()` at which the server moves on. */
  at: number;
  durationMs: number;
  delay: number;
}

/**
 * Display-only countdown for the break after a round result. The server moves on by itself;
 * this only tells the players what is coming and when.
 */
export function NextUp({ label, at, durationMs, delay: d }: NextUpProps) {
  const remainingMs = useCountdown(at);
  const seconds = Math.ceil(remainingMs / 1000);

  return (
    <div className="enter mt-10" style={delay(d)}>
      <div className="flex items-baseline justify-between gap-4 font-mono text-xs uppercase tracking-[0.3em] text-ink-dim">
        <span>
          Next / <span className="text-ink">{label}</span>
        </span>
        <span className="text-base font-semibold tracking-normal tabular-nums text-gold">
          {seconds > 0 ? `${seconds}s` : "now"}
        </span>
      </div>
      <CountdownBar deadline={at} durationMs={durationMs} warn={false} className="mt-2 h-0.5" />
    </div>
  );
}
