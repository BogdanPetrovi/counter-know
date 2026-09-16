export interface JoinQueueButtonProps {
  searching: boolean;
  connecting: boolean;
  onClick: () => void;
}

export function JoinQueueButton({
  searching,
  connecting,
  onClick,
}: JoinQueueButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={searching || connecting}
      className="relative mt-10 w-full max-w-72 overflow-hidden rounded-xl bg-gold px-8 py-5 text-sm font-semibold uppercase tracking-[0.2em] text-navy-900 transition-colors duration-300 enabled:cursor-pointer enabled:hover:bg-ink disabled:bg-navy-800 disabled:text-ink-dim"
    >
      {connecting && "Connecting"}
      {searching && <span className="caret">Searching</span>}
      {!connecting && !searching && "Join queue"}
      {searching && (
        <span className="scan-bar absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-navy-700" />
      )}
    </button>
  );
}
