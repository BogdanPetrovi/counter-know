import { delay } from "./animation";

export interface LetterTileProps {
  char: string;
  index: number;
  used: boolean;
  delay: number;
  onPick: (index: number) => void;
}

export function LetterTile({ char, index, used, delay: d, onPick }: LetterTileProps) {
  return (
    <button
      type="button"
      disabled={used}
      onClick={() => onPick(index)}
      className={`enter flex aspect-square items-center justify-center border font-mono text-2xl font-semibold transition-all duration-200 sm:text-3xl ${
        used
          ? "cursor-default border-navy-700 bg-navy-900 text-ink-dim/40"
          : "cursor-pointer border-navy-700 bg-navy-800 text-ink hover:-translate-y-0.5 hover:border-gold hover:text-gold"
      }`}
      style={delay(d)}
    >
      {char}
    </button>
  );
}
