"use client";

import { useState } from "react";
import type { GameOnePlayerResult, GameOneRound } from "@/context/GameContext";
import { formatTime } from "@/components/home/formatTime";
import { delay } from "./animation";
import { CountdownBar } from "./CountdownBar";
import { TONE_CLASSES, type PlayerTone } from "./playerTone";
import { WARN_BELOW_MS } from "./RoundTimer";
import { useCountdown } from "./useCountdown";

export interface RoundResultCardProps {
  label: string;
  self: boolean;
  side: "left" | "right";
  /** Same colour as this player's side of the score bar. */
  tone: PlayerTone;
  result: GameOnePlayerResult | undefined;
  /** The round is still running for this player: show a waiting state until the server ends it. */
  pending?: GameOneRound | null;
  delay: number;
}

export function RoundResultCard({ label, self, side, tone, result, pending = null, delay: d }: RoundResultCardProps) {
  const right = side === "right";
  const t = TONE_CLASSES[tone];
  // A card that starts out waiting animates its result in once the round ends.
  const [startedPending] = useState(pending !== null);

  return (
    <div
      className={`${right ? "enter-right" : "enter-left"} relative flex flex-col gap-5 overflow-hidden border p-6 sm:p-8 ${
        t.border
      } ${self ? t.tint : ""} ${right ? "sm:items-end sm:text-right" : ""}`}
      style={delay(d)}
      aria-busy={pending !== null}
    >
      <span className={`font-mono text-xs uppercase tracking-[0.3em] ${t.text}`}>
        {label}
      </span>

      <div aria-live="polite" className={`flex flex-col gap-5 ${right ? "sm:items-end" : ""}`}>
        {pending ? (
          <PendingBody round={pending} right={right} />
        ) : (
          <ResolvedBody result={result} right={right} animate={startedPending} tone={tone} />
        )}
      </div>
    </div>
  );
}

function PendingBody({ round, right }: { round: GameOneRound; right: boolean }) {
  const remainingMs = useCountdown(round.deadline);
  const warn = remainingMs <= WARN_BELOW_MS;

  return (
    <>
      <span className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-ink-dim sm:text-3xl">
        <span
          aria-hidden
          className={`h-5 w-5 shrink-0 rounded-full border-2 border-navy-700 border-t-gold motion-safe:animate-spin ${
            right ? "sm:order-last" : ""
          }`}
        />
        Solving
      </span>

      {/* Same box as the points line, so nothing jumps when the result lands. */}
      <span aria-hidden className="h-10 w-20 bg-navy-700 motion-safe:animate-pulse sm:h-12 sm:w-24" />

      <span
        className={`font-mono text-xs tabular-nums transition-colors duration-300 ${
          warn ? "text-danger" : "text-ink-dim"
        }`}
      >
        {formatTime(Math.ceil(remainingMs / 1000))} left
      </span>

      {/* Pinned to the card's bottom edge (the card is the positioned ancestor). */}
      <CountdownBar
        deadline={round.deadline}
        durationMs={round.durationMs}
        warn={warn}
        className="absolute inset-x-0 bottom-0 h-0.5"
      />
    </>
  );
}

function ResolvedBody({
  result,
  right,
  animate,
  tone,
}: {
  result: GameOnePlayerResult | undefined;
  right: boolean;
  animate: boolean;
  tone: PlayerTone;
}) {
  const solved = result?.solved ?? false;
  const points = result?.points ?? 0;

  return (
    <div
      className={`flex flex-col gap-5 ${right ? "sm:items-end" : ""} ${animate ? "enter" : ""}`}
      style={animate ? delay(0) : undefined}
    >
      <span
        className={`flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl ${
          solved ? "text-success" : "text-danger"
        }`}
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={right ? "sm:order-last" : undefined}
        >
          {solved ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
        </svg>
        {solved ? "Solved" : "Missed"}
      </span>

      <span
        className={`font-mono text-4xl font-semibold tabular-nums sm:text-5xl ${
          points > 0 ? TONE_CLASSES[tone].text : "text-ink-dim/50"
        }`}
      >
        +{points}
      </span>

      <span className="font-mono text-xs text-ink-dim">
        {solved && result?.timeMs != null
          ? `${(result.timeMs / 1000).toFixed(1)}s${result.first ? " / first" : ""}`
          : "no correct answer"}
      </span>
    </div>
  );
}
