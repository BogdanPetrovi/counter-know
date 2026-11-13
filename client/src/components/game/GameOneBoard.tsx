"use client";

import { useCallback, useEffect, useState } from "react";
import type { GameOneAnswerResult, GameOneRound } from "@/context/GameContext";
import { delay } from "./animation";
import { LetterTile } from "./LetterTile";
import { RoundTimer } from "./RoundTimer";
import { SubmitAnswerButton } from "./SubmitAnswerButton";
import { WordInput, type WordFeedback } from "./WordInput";

type Phase = "playing" | "pending" | "wrong" | "correct";

export interface GameOneBoardProps {
  round: GameOneRound;
  /** The server ended the round; nothing can be picked or sent any more. */
  over: boolean;
  onSubmit: (answer: string) => Promise<GameOneAnswerResult>;
}

export function GameOneBoard({ round, over, onSubmit }: GameOneBoardProps) {
  const { chars } = round;
  const [picked, setPicked] = useState<number[]>([]);
  const [phase, setPhase] = useState<Phase>("playing");
  const [points, setPoints] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const locked = over || phase !== "playing";
  const word = picked.map((i) => chars[i]).join("");
  const feedback: WordFeedback =
    phase === "wrong" ? "wrong" : phase === "correct" ? "correct" : "idle";

  const pick = (index: number) => {
    if (locked) return;
    setNotice(null);
    setPicked((p) => (p.includes(index) ? p : [...p, index]));
  };

  const backspace = useCallback(() => {
    if (locked) return;
    setPicked((p) => p.slice(0, -1));
  }, [locked]);

  const submit = useCallback(async () => {
    if (locked || word.length === 0) return;
    setPhase("pending");
    setNotice(null);

    const result = await onSubmit(word);
    if (result.status === "correct") {
      setPoints(result.result.points);
      setPhase("correct");
    } else if (result.status === "wrong") {
      setPhase("wrong");
    } else {
      setNotice(result.message);
      setPhase("playing");
    }
  }, [locked, word, onSubmit]);

  // The wrong word stays visible while the box shakes, then the field is cleared.
  const onShakeEnd = () => {
    setPicked([]);
    setPhase("playing");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void submit();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        backspace();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit, backspace]);

  return (
    <div>
      <h1
        className="enter mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
        style={delay(0)}
      >
        Find the player
      </h1>

      <div className="mt-5">
        <RoundTimer
          number={round.number}
          total={round.total}
          deadline={round.deadline}
          durationMs={round.durationMs}
          delay={0.2}
        />
      </div>

      <div className="mt-7">
        <WordInput
          word={word}
          delay={0.35}
          feedback={feedback}
          locked={locked}
          onBackspace={backspace}
          onShakeEnd={onShakeEnd}
        />
      </div>

      <p
        aria-live="polite"
        className={`mt-3 h-4 font-mono text-xs ${phase === "correct" ? "text-success" : "text-danger"}`}
      >
        {phase === "wrong" && "! Wrong answer"}
        {phase === "correct" && `Correct / +${points} pts`}
        {notice && `! ${notice}`}
      </p>

      <div className="mt-4 grid grid-cols-6 gap-2 sm:gap-3">
        {chars.map((char, index) => (
          <LetterTile
            key={index}
            char={char}
            index={index}
            used={picked.includes(index)}
            locked={locked}
            delay={0.6 + index * 0.05}
            onPick={pick}
          />
        ))}
      </div>

      <div className="mt-6">
        <SubmitAnswerButton
          disabled={locked || word.length === 0}
          pending={phase === "pending"}
          delay={1.3}
          onClick={() => void submit()}
        />
      </div>
    </div>
  );
}
