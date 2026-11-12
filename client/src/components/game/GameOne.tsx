"use client";

import { useCallback, useState, type AnimationEvent, type CSSProperties } from "react";
import type {
  GameOneAnswerResult,
  GameOnePlayerResult,
  GameOneRound,
  GameOneRoundResult,
} from "@/context/GameContext";
import { GameOneBoard } from "./GameOneBoard";
import { GameOneResult } from "./GameOneResult";

const SOLVED_HOLD: CSSProperties = { animationDelay: "0.35s" };

export interface GameOneProps {
  round: GameOneRound;
  result: GameOneRoundResult | null;
  selfId: string;
  opponentId: string;
  /** Our position in `game.players`, so result cards sit on the same side as in the score bar. */
  selfIndex: number;
  onSubmit: (answer: string) => Promise<GameOneAnswerResult>;
}

interface SelfSolve {
  answer: string;
  result: GameOnePlayerResult;
}

export function GameOne({ round, result, selfId, opponentId, selfIndex, onSubmit }: GameOneProps) {
  // Set as soon as the server accepts our answer, before the round itself is over.
  const [selfSolve, setSelfSolve] = useState<SelfSolve | null>(null);
  // The board plays its exit animation, then the reveal takes its place.
  const [boardGone, setBoardGone] = useState(false);

  const submit = useCallback(
    async (answer: string) => {
      const res = await onSubmit(answer);
      if (res.status === "correct") setSelfSolve({ answer: res.answer, result: res.result });
      return res;
    },
    [onSubmit],
  );

  const roundOver = result !== null;
  const boardLeaving = (roundOver || selfSolve !== null) && !boardGone;

  const onBoardLeft = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setBoardGone(true);
  };

  if (boardGone && result) {
    return (
      <GameOneResult
        answer={result.answer}
        self={result.results.find((r) => r.playerId === selfId)}
        opponent={result.results.find((r) => r.playerId === opponentId)}
        selfIndex={selfIndex}
        round={round}
      />
    );
  }

  if (boardGone && selfSolve) {
    // We solved it; the opponent is still playing until the server ends the round.
    return (
      <GameOneResult
        answer={selfSolve.answer}
        self={selfSolve.result}
        opponent={null}
        selfIndex={selfIndex}
        round={round}
      />
    );
  }

  return (
    <div
      className={boardLeaving ? "leave" : undefined}
      style={boardLeaving && !roundOver ? SOLVED_HOLD : undefined}
      onAnimationEnd={onBoardLeft}
    >
      <GameOneBoard round={round} over={roundOver} onSubmit={submit} />
    </div>
  );
}
