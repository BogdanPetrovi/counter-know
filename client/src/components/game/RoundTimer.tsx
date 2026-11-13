"use client";

import { formatTime } from "@/components/home/formatTime";
import { delay } from "./animation";
import { CountdownBar } from "./CountdownBar";
import { RoundPips } from "./RoundPips";
import { roundOf } from "./roundLabel";
import { useCountdown } from "./useCountdown";

export const WARN_BELOW_MS = 10_000;

export interface RoundTimerProps {
  /** 1-based round on screen. */
  number: number;
  total: number;
  /** Local `Date.now()` at which the server ends the round. */
  deadline: number;
  durationMs: number;
  delay: number;
}

/**
 * Display-only countdown. The server owns the real timer and ends the round itself;
 * this just mirrors the time it announced when the round started.
 */
export function RoundTimer({ number, total, deadline, durationMs, delay: d }: RoundTimerProps) {
  const remainingMs = useCountdown(deadline);
  const warn = remainingMs <= WARN_BELOW_MS;

  return (
    <div className="enter" style={delay(d)}>
      <div className="flex items-baseline justify-between font-mono text-xs uppercase tracking-[0.3em] text-ink-dim">
        <span className="flex items-center gap-3">
          {roundOf(number, total)}
          <RoundPips number={number} total={total} />
        </span>
        <span
          className={`text-base font-semibold tracking-normal tabular-nums transition-colors duration-300 ${
            warn ? "text-danger" : "text-ink"
          }`}
        >
          {formatTime(Math.ceil(remainingMs / 1000))}
        </span>
      </div>
      <CountdownBar
        deadline={deadline}
        durationMs={durationMs}
        warn={warn}
        className="mt-2 h-0.5"
      />
    </div>
  );
}
