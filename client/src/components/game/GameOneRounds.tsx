"use client";

import { useState, type AnimationEvent } from "react";
import type { GameOneRoundResult } from "@/context/GameContext";
import { GameOne, type GameOneProps } from "./GameOne";

export interface GameOneRoundsProps extends Omit<GameOneProps, "result"> {
  /** Latest round result from the server; may still belong to the previous round. */
  result: GameOneRoundResult | null;
}

/**
 * Plays game one round after round. When the server starts the next round, the previous
 * result plays its exit animation first, then a fresh board takes its place.
 */
export function GameOneRounds({ round, result, ...rest }: GameOneRoundsProps) {
  // Lags behind `round` while the previous round is leaving.
  const [shown, setShown] = useState(round);
  const switching = shown.number !== round.number;
  const shownResult = result?.round === shown.number ? result : null;

  const onLeft = (e: AnimationEvent<HTMLDivElement>) => {
    if (switching && e.target === e.currentTarget) setShown(round);
  };

  return (
    <div
      key={shown.number}
      className={switching ? "leave" : undefined}
      onAnimationEnd={onLeft}
    >
      <GameOne round={shown} result={shownResult} {...rest} />
    </div>
  );
}
