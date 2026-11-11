import type { GameOnePlayerResult, GameOneRound } from "@/context/GameContext";
import { delay } from "./animation";
import { RoundResultCard } from "./RoundResultCard";

export interface GameOneResultProps {
  answer: string;
  self: GameOnePlayerResult | undefined;
  /** `null` while the opponent is still playing the round. */
  opponent: GameOnePlayerResult | undefined | null;
  round: GameOneRound;
}

function headline(self: GameOnePlayerResult | undefined, opponent: GameOnePlayerResult | undefined | null) {
  if (self?.solved) return self.first ? "You were faster." : "Solved, but second.";
  if (opponent?.solved) return "Opponent got it.";
  return "Time's up.";
}

export function GameOneResult({ answer, self, opponent, round }: GameOneResultProps) {
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
        Round 01 / correct answer
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
        <RoundResultCard label="You" self side="left" result={self} delay={1} />
        <RoundResultCard
          label="Opponent"
          self={false}
          side="right"
          result={opponent ?? undefined}
          pending={opponent === null ? round : null}
          delay={1.2}
        />
      </div>
    </div>
  );
}
