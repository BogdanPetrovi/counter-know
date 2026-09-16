export interface LeaveQueueButtonProps {
  onClick: () => void;
}

export function LeaveQueueButton({ onClick }: LeaveQueueButtonProps) {
  return (
    <button
      onClick={onClick}
      className="cursor-pointer text-sm font-semibold uppercase tracking-[0.2em] text-gold transition-colors duration-300 hover:text-ink"
    >
      Leave queue
    </button>
  );
}
