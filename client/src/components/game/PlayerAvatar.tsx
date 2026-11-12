import { TONE_CLASSES, type PlayerTone } from "./playerTone";

/** Empty profile picture until players have real avatars. Decorative: the name next to it is the label. */
export function PlayerAvatar({ tone }: { tone: PlayerTone }) {
  const t = TONE_CLASSES[tone];

  return (
    <span
      aria-hidden
      className={`flex h-9 w-9 shrink-0 items-center justify-center border ${t.border} ${t.tint} sm:h-11 sm:w-11`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-5 w-5 opacity-80 sm:h-6 sm:w-6 ${t.text}`}
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    </span>
  );
}
