import { formatTime } from "./formatTime";
import { useElapsedSeconds } from "./useElapsedSeconds";

export interface QueueStatusProps {
  searching: boolean;
  error: string | null;
}

export function QueueStatus({ searching, error }: QueueStatusProps) {
  const seconds = useElapsedSeconds(searching);

  return (
    <p className="mt-4 h-5 font-mono text-sm text-ink-dim">
      {searching && formatTime(seconds)}
      {!searching && error && <span className="text-gold">! {error}</span>}
    </p>
  );
}
