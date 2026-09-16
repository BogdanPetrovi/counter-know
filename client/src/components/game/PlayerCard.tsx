import { delay } from "./animation";
import { Typed } from "./Typed";

export interface PlayerCardProps {
  id: string;
  label: string;
  self: boolean;
  side: "left" | "right";
  delay: number;
}

export function PlayerCard({ id, label, self, side, delay: d }: PlayerCardProps) {
  return (
    <div
      className={`${side === "left" ? "enter-left" : "enter-right"} flex flex-col gap-6 border p-6 sm:p-8 ${
        self ? "border-gold bg-navy-800" : "border-navy-700"
      } ${side === "right" ? "sm:items-end sm:text-right" : ""}`}
      style={delay(d)}
    >
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-ink-dim">
        {side === "left" ? "01" : "02"}
      </span>
      <span
        className={`text-3xl font-semibold tracking-tight sm:text-4xl ${
          self ? "text-gold" : "text-ink"
        }`}
      >
        {label}
      </span>
      <span className="max-w-full overflow-hidden font-mono text-xs text-ink-dim">
        <Typed text={id} delay={d + 0.4} />
      </span>
    </div>
  );
}
