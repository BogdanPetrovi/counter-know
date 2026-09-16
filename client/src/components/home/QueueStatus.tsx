import { formatTime } from "./formatTime";
import { useElapsedSeconds } from "./useElapsedSeconds";
import { LeaveQueueButton } from "./LeaveQueueButton";

export interface QueueStatusProps {
  searching: boolean;
  error: string | null;
  onLeave: () => void;
}

export function QueueStatus({ searching, error, onLeave }: QueueStatusProps) {
  const seconds = useElapsedSeconds(searching);

  if (searching) {
    return (
      <div className="mt-3 flex items-center justify-between">
        <LeaveQueueButton onClick={onLeave} />
        <span className="font-mono text-sm text-ink-dim">
          {formatTime(seconds)}
        </span>
      </div>
    );
  }

  return (
    <p className="mt-3 h-5 font-mono text-sm text-gold">
      {error && `! ${error}`}
    </p>
  );
}
