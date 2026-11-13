"use client";

import { useState } from "react";
import type { GameScores } from "@/context/GameContext";
import { delay } from "./animation";
import { ScoreBarPlayer } from "./ScoreBarPlayer";
import { TONE_CLASSES, toneForIndex, type PlayerTone } from "./playerTone";

export interface ScoreBarProps {
  /** In server order: index 0 is blue on the left, index 1 red on the right. */
  players: string[];
  selfId: string;
  /** Server snapshot of the game totals. */
  scores: GameScores;
  /** Fades out while the game end screen takes over. */
  leaving?: boolean;
}

/** Sticky strip under the top bar with both players and the game score. Display only. */
export function ScoreBar({ players, selfId, scores, leaving = false }: ScoreBarProps) {
  const [blueId, redId] = players;
  const blue = scores[blueId] ?? 0;
  const red = scores[redId] ?? 0;

  const label = (id: string) => (id === selfId ? "You" : "Opponent");

  return (
    <section
      aria-label="Scoreboard"
      className={`${leaving ? "leave" : "drop-in"} sticky top-0 z-20 bg-navy-900/90 px-6 backdrop-blur-sm sm:px-10`}
    >
      <div className="mx-auto grid w-full max-w-3xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 py-3 sm:gap-6">
        <ScoreBarPlayer id={blueId} label={label(blueId)} tone={toneForIndex(0)} side="left" delay={0.15} />

        <div
          aria-hidden
          className="vs flex items-baseline gap-2 font-mono text-2xl font-semibold tabular-nums sm:gap-3 sm:text-3xl"
          style={delay(0.35)}
        >
          <ScoreValue value={blue} tone={toneForIndex(0)} />
          <span className="text-lg text-ink-dim/60 sm:text-xl">:</span>
          <ScoreValue value={red} tone={toneForIndex(1)} />
        </div>

        <ScoreBarPlayer id={redId} label={label(redId)} tone={toneForIndex(1)} side="right" delay={0.25} />
      </div>

      <p className="sr-only" aria-live="polite">
        {label(blueId)} {blue} points, {label(redId)} {red} points
      </p>

      {/* Each side's colour along the bottom edge, always half and half. */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 flex h-0.5">
        <span className={`flex-1 ${TONE_CLASSES[toneForIndex(0)].bg}`} />
        <span className={`flex-1 ${TONE_CLASSES[toneForIndex(1)].bg}`} />
      </div>
    </section>
  );
}

function ScoreValue({ value, tone }: { value: number; tone: PlayerTone }) {
  // Only bump on changes, not on the first render.
  const [initial] = useState(value);

  return (
    <span
      key={value}
      className={`inline-block ${TONE_CLASSES[tone].text} ${value !== initial ? "score-bump" : ""}`}
    >
      {value}
    </span>
  );
}
