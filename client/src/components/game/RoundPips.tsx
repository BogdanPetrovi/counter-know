export interface RoundPipsProps {
  /** 1-based round on screen. */
  number: number;
  total: number;
}

/** One segment per round: played and current rounds are lit. Decorative, the label carries the meaning. */
export function RoundPips({ number, total }: RoundPipsProps) {
  return (
    <span aria-hidden className="flex items-center gap-1">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1 w-5 transition-colors duration-300 ${
            i < number ? "bg-gold" : "bg-navy-700"
          }`}
        />
      ))}
    </span>
  );
}
