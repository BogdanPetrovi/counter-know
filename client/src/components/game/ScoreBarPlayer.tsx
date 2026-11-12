import { delay } from "./animation";
import { PlayerAvatar } from "./PlayerAvatar";
import type { PlayerTone } from "./playerTone";

export interface ScoreBarPlayerProps {
  id: string;
  label: string;
  tone: PlayerTone;
  side: "left" | "right";
  delay: number;
}

export function ScoreBarPlayer({ id, label, tone, side, delay: d }: ScoreBarPlayerProps) {
  const right = side === "right";

  return (
    <div
      className={`${right ? "enter-right flex-row-reverse text-right" : "enter-left"} flex min-w-0 items-center gap-2 sm:gap-3`}
      style={delay(d)}
    >
      <PlayerAvatar tone={tone} />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold tracking-tight text-ink sm:text-base">
          {label}
        </span>
        {/* Stand-in for a username until accounts exist. */}
        <span className="truncate font-mono text-xs text-ink-dim">#{id.slice(0, 6)}</span>
      </div>
    </div>
  );
}
