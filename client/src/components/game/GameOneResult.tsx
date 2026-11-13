"use client";

import { useState } from "react";
import type { GameOnePlayerResult, GameOneRound } from "@/context/GameContext";
import { delay } from "./animation";
import { NextUp, type NextUpProps } from "./NextUp";
import { toneForIndex } from "./playerTone";
import { roundOf } from "./roundLabel";
import { RoundResultCard, type RoundResultCardProps } from "./RoundResultCard";

export interface GameOneResultProps {
  answer: string;
  self: GameOnePlayerResult | undefined;
  /** `null` while the opponent is still playing the round. */
  opponent: GameOnePlayerResult | undefined | null;
  /** Our position in `game.players`; cards follow the score bar (0 is blue on the left). */
  selfIndex: number;
  round: GameOneRound;
  /** The break after the round, once the server has ended it. */
  next: Omit<NextUpProps, "delay"> | null;
}

// Lands after the result cards on a fresh screen, or shortly after the waiting card resolves.
const NEXT_AFTER_CARDS = 1.6;
const NEXT_AFTER_RESOLVE = 0.4;

type CardData = Pick<RoundResultCardProps, "label" | "self" | "result" | "pending">;

function headline(self: GameOnePlayerResult | undefined, opponent: GameOnePlayerResult | undefined | null) {
  if (self?.solved) return self.first ? "You were faster." : "Solved, but second.";
  if (opponent?.solved) return "Opponent got it.";
  return "Time's up.";
}

export function GameOneResult({ answer, self, opponent, selfIndex, round, next }: GameOneResultProps) {
  const [mountedWithNext] = useState(next !== null);
  const selfCard: CardData = { label: "You", self: true, result: self };
  const opponentCard: CardData = {
    label: "Opponent",
    self: false,
    result: opponent ?? undefined,
    pending: opponent === null ? round : null,
  };
  const cards = selfIndex === 0 ? [selfCard, opponentCard] : [opponentCard, selfCard];

  return (
    <div>
      <h1
        className="enter mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
        style={delay(0)}
      >
        {headline(self, opponent)}
      </h1>

      <p
        className="enter mt-3 font-mono text-xs uppercase tracking-[0.3em] text-ink-dim"
        style={delay(0.2)}
      >
        {roundOf(round.number, round.total)} / correct answer
      </p>

      <div
        className="enter mt-5 flex min-h-16 items-center border border-gold bg-navy-800 px-5 py-3"
        style={delay(0.35)}
        aria-label={`Correct answer: ${answer}`}
      >
        <span className="font-mono text-2xl font-semibold tracking-[0.3em] text-gold sm:text-3xl">
          {[...answer].map((char, i) => (
            <span key={i} className="enter inline-block" style={delay(0.6 + i * 0.07)}>
              {char}
            </span>
          ))}
        </span>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        {cards.map((card, i) => (
          <RoundResultCard
            key={card.label}
            {...card}
            side={i === 0 ? "left" : "right"}
            tone={toneForIndex(i)}
            delay={1 + i * 0.2}
          />
        ))}
      </div>

      {next && (
        <NextUp {...next} delay={mountedWithNext ? NEXT_AFTER_CARDS : NEXT_AFTER_RESOLVE} />
      )}
    </div>
  );
}
