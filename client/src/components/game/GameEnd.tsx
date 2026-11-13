"use client";

import { useEffect, useRef } from "react";
import type { GameEndResult } from "@/context/GameContext";
import { delay } from "./animation";
import { FinalPlayerCard, type FinalOutcome } from "./FinalPlayerCard";
import { toneForIndex } from "./playerTone";

export interface GameEndProps {
  /** In server order, so each card keeps its side and colour from the score bar. */
  players: string[];
  selfId: string;
  result: GameEndResult;
  onPlayAgain: () => void;
  onLeave: () => void;
}

const COUNT_AT = 0.9;

const FOCUS_RING = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

function outcomeFor(winnerId: string | null, playerId: string): FinalOutcome {
  if (winnerId === null) return "draw";
  return winnerId === playerId ? "won" : "lost";
}

function headline(outcome: FinalOutcome) {
  if (outcome === "won") return "Victory.";
  if (outcome === "lost") return "Defeat.";
  return "Draw.";
}

function summary(outcome: FinalOutcome, self: number, opponent: number) {
  if (outcome === "won") return `You won ${self} to ${opponent}.`;
  if (outcome === "lost") return `Your opponent won ${opponent} to ${self}.`;
  return `You both finished on ${self} points.`;
}

export function GameEnd({ players, selfId, result, onPlayAgain, onLeave }: GameEndProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const opponentId = players.find((p) => p !== selfId) ?? players[1];
  const outcome = outcomeFor(result.winnerId, selfId);
  const selfScore = result.scores[selfId] ?? 0;
  const opponentScore = result.scores[opponentId] ?? 0;

  // Land keyboard and screen reader users on the result instead of the now empty page.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <section aria-labelledby="game-end-title">
      <p
        className="enter mt-4 font-mono text-xs uppercase tracking-[0.3em] text-ink-dim"
        style={delay(0)}
      >
        Game over / final score
      </p>

      <h1
        id="game-end-title"
        ref={headingRef}
        tabIndex={-1}
        className={`enter mt-3 text-5xl font-semibold tracking-tight outline-none sm:text-6xl ${
          outcome === "won" ? "text-gold" : "text-ink"
        }`}
        style={delay(0.1)}
      >
        {headline(outcome)}
      </h1>

      <p className="enter mt-3 text-ink-dim" style={delay(0.3)}>
        {summary(outcome, selfScore, opponentScore)}
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6">
        {players.map((id, i) => (
          <FinalPlayerCard
            key={id}
            id={id}
            label={id === selfId ? "You" : "Opponent"}
            score={result.scores[id] ?? 0}
            outcome={outcomeFor(result.winnerId, id)}
            side={i === 0 ? "left" : "right"}
            tone={toneForIndex(i)}
            delay={0.5 + i * 0.15}
            countAt={COUNT_AT}
          />
        ))}
      </div>

      <div className="enter mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4" style={delay(1.6)}>
        <button
          type="button"
          onClick={onPlayAgain}
          className={`cursor-pointer rounded-xl border border-gold bg-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-navy-900 transition-colors duration-300 hover:border-ink hover:bg-ink ${FOCUS_RING}`}
        >
          Play again
        </button>
        <button
          type="button"
          onClick={onLeave}
          className={`cursor-pointer rounded-xl border border-navy-700 px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-ink-dim transition-colors duration-300 hover:border-gold hover:text-gold ${FOCUS_RING}`}
        >
          Back to lobby
        </button>
      </div>
    </section>
  );
}
