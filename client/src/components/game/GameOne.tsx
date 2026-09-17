"use client";

import { useState } from "react";
import { delay } from "./animation";
import { LetterTile } from "./LetterTile";
import { WordInput } from "./WordInput";

export interface GameOneProps {
  chars: string[];
}

export function GameOne({ chars }: GameOneProps) {

  const [picked, setPicked] = useState<number[]>([]);

  const pick = (index: number) => {
    setPicked((p) => (p.includes(index) ? p : [...p, index]));
  };

  const backspace = () => {
    setPicked((p) => p.slice(0, -1));
  };

  const word = picked.map((i) => chars[i]).join("");

  return (
    <div>
      <h1
        className="enter mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
        style={delay(0)}
      >
        Find the player
      </h1>

      <p
        className="enter mt-3 font-mono text-xs uppercase tracking-[0.3em] text-ink-dim"
        style={delay(0.2)}
      >
        Round 01
      </p>

      <div className="mt-7">
        <WordInput word={word} delay={0.35} onBackspace={backspace} />
      </div>

      <div className="mt-5 grid grid-cols-6 gap-2 sm:gap-3">
        {chars.map((char, index) => (
          <LetterTile
            key={index}
            char={char}
            index={index}
            used={picked.includes(index)}
            delay={0.6 + index * 0.05}
            onPick={pick}
          />
        ))}
      </div>
    </div>
  );
}
