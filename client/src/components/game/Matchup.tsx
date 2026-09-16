import { delay } from "./animation";
import { PlayerCard } from "./PlayerCard";

export interface MatchupProps {
  selfId: string;
  opponentId: string;
  delay: number;
}

export function Matchup({ selfId, opponentId, delay: d }: MatchupProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-[1fr_auto_1fr] sm:gap-6">
      <PlayerCard id={selfId} label="You" self side="left" delay={d} />

      <span
        className="vs justify-self-center font-mono text-2xl font-semibold text-gold"
        style={delay(d + 0.5)}
      >
        VS
      </span>

      <PlayerCard
        id={opponentId}
        label="Opponent"
        self={false}
        side="right"
        delay={d + 0.2}
      />
    </div>
  );
}
