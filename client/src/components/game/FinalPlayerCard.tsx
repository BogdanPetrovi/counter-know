"use client";

import { delay } from "./animation";
import { PlayerAvatar } from "./PlayerAvatar";
import { TONE_CLASSES, type PlayerTone } from "./playerTone";
import { useCountUp } from "./useCountUp";
import { WinnerBadge } from "./WinnerBadge";

export type FinalOutcome = "won" | "lost" | "draw";

export interface FinalPlayerCardProps {
  id: string;
  label: string;
  score: number;
  outcome: FinalOutcome;
  side: "left" | "right";
  /** Same colour as this player's side of the score bar. */
  tone: PlayerTone;
  delay: number;
  /** When the score starts counting up, in seconds. The winner is revealed once it stops. */
  countAt: number;
}

const COUNT_MS = 900;

export function FinalPlayerCard({
  id,
  label,
  score,
  outcome,
  side,
  tone,
  delay: d,
  countAt,
}: FinalPlayerCardProps) {
  const right = side === "right";
  const t = TONE_CLASSES[tone];
  const won = outcome === "won";
  const lost = outcome === "lost";
  const shown = useCountUp(score, { delayMs: countAt * 1000, durationMs: COUNT_MS });
  const revealAt = countAt + COUNT_MS / 1000;

  return (
    <div
      className={`${right ? "enter-right items-end text-right" : "enter-left"} relative flex min-w-0 flex-col gap-6 border p-4 sm:gap-8 sm:p-8 ${
        lost ? "border-navy-700" : t.border
      } ${won ? t.tint : ""}`}
      style={delay(d)}
    >
      {won && (
        <>
          <span
            aria-hidden
            className={`fade-in pointer-events-none absolute inset-0 ${t.glow}`}
            style={delay(revealAt)}
          />
          <WinnerBadge
            delay={revealAt}
            className={`absolute -top-3.5 ${right ? "right-3 sm:right-6" : "left-3 sm:left-6"}`}
          />
        </>
      )}

      <div className={`flex min-w-0 max-w-full items-center gap-2 sm:gap-3 ${right ? "flex-row-reverse" : ""}`}>
        <PlayerAvatar tone={tone} />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold tracking-tight text-ink sm:text-lg">{label}</span>
          {/* Stand-in for a username until accounts exist. */}
          <span className="truncate font-mono text-xs text-ink-dim">#{id.slice(0, 6)}</span>
        </div>
      </div>

      <div className={`flex flex-col gap-2 ${right ? "items-end" : ""}`}>
        <span
          aria-hidden
          className={`font-mono text-5xl font-semibold leading-none tabular-nums sm:text-7xl ${
            lost ? "text-ink-dim/60" : t.text
          }`}
        >
          {shown}
        </span>
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink-dim">
          <span className="sr-only">{score} </span>
          points
        </span>
      </div>
    </div>
  );
}
