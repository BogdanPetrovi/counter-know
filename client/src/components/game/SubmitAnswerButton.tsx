import { delay } from "./animation";

export interface SubmitAnswerButtonProps {
  disabled: boolean;
  pending: boolean;
  delay: number;
  onClick: () => void;
}

export function SubmitAnswerButton({ disabled, pending, delay: d, onClick }: SubmitAnswerButtonProps) {
  return (
    <div className="enter" style={delay(d)}>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="w-full rounded-xl bg-gold px-8 py-5 text-sm font-semibold uppercase tracking-[0.2em] text-navy-900 transition-colors duration-300 enabled:cursor-pointer enabled:hover:bg-ink disabled:bg-navy-800 disabled:text-ink-dim"
      >
        {pending ? <span className="caret">Checking</span> : "Submit"}
      </button>
      <p className="mt-2 text-right font-mono text-[10px] uppercase tracking-[0.3em] text-ink-dim/60">
        enter to submit
      </p>
    </div>
  );
}
