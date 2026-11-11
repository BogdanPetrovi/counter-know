import type { AnimationEvent } from "react";
import { delay } from "./animation";

export type WordFeedback = "idle" | "wrong" | "correct";

export interface WordInputProps {
  word: string;
  delay: number;
  feedback: WordFeedback;
  locked: boolean;
  onBackspace: () => void;
  /** Fires once the wrong-answer shake has finished playing. */
  onShakeEnd: () => void;
}

const BOX_STYLES: Record<WordFeedback, string> = {
  idle: "border-gold bg-navy-800",
  wrong: "shake border-danger bg-danger/10",
  correct: "confirm-pop border-success bg-success/10",
};

const WORD_STYLES: Record<WordFeedback, string> = {
  idle: "text-ink",
  wrong: "text-danger",
  correct: "text-success",
};

export function WordInput({
  word,
  delay: d,
  feedback,
  locked,
  onBackspace,
  onShakeEnd,
}: WordInputProps) {
  const empty = word.length === 0;
  const canDelete = !empty && !locked;

  const onAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.animationName === "shake") onShakeEnd();
  };

  return (
    // The entrance animation lives on the wrapper so it never fights the feedback animations.
    <div className="enter" style={delay(d)}>
      <div
        onAnimationEnd={onAnimationEnd}
        className={`flex min-h-16 items-center gap-4 border px-5 py-3 transition-colors duration-200 ${BOX_STYLES[feedback]}`}
      >
        <span
          className={`flex-1 truncate font-mono text-2xl font-semibold tracking-[0.3em] transition-colors duration-200 sm:text-3xl ${
            empty ? "text-ink-dim/50" : WORD_STYLES[feedback]
          }`}
        >
          {empty ? "..." : word}
          {!empty && !locked && <span className="caret" />}
        </span>

        {feedback === "correct" ? (
          <svg
            aria-label="Correct"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-success"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : (
          <button
            type="button"
            aria-label="Delete last letter"
            disabled={!canDelete}
            onClick={onBackspace}
            className={`shrink-0 transition-colors duration-200 ${
              canDelete ? "cursor-pointer text-gold hover:text-ink" : "cursor-default text-ink-dim/40"
            }`}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 5H9l-6 7 6 7h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z" />
              <path d="m18 9-6 6" />
              <path d="m12 9 6 6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
