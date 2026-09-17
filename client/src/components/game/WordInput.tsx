import { delay } from "./animation";

export interface WordInputProps {
  word: string;
  delay: number;
  onBackspace: () => void;
}

export function WordInput({ word, delay: d, onBackspace }: WordInputProps) {
  const empty = word.length === 0;

  return (
    <div
      className="enter flex min-h-16 items-center gap-4 border border-gold bg-navy-800 px-5 py-3"
      style={delay(d)}
    >
      <span
        className={`flex-1 truncate font-mono text-2xl font-semibold tracking-[0.3em] sm:text-3xl ${
          empty ? "text-ink-dim/50" : "text-ink"
        }`}
      >
        {empty ? "..." : word}
        {!empty && <span className="caret" />}
      </span>

      <button
        type="button"
        aria-label="Delete last letter"
        disabled={empty}
        onClick={onBackspace}
        className={`shrink-0 transition-colors duration-200 ${
          empty ? "cursor-default text-ink-dim/40" : "cursor-pointer text-gold hover:text-ink"
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
    </div>
  );
}
