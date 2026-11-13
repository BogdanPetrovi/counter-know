/** Side colour of a player. Purely visual: the server knows nothing about it. */
export type PlayerTone = "blue" | "red";

// Full class names so Tailwind can see them at build time.
export const TONE_CLASSES: Record<
  PlayerTone,
  { text: string; border: string; bg: string; tint: string; glow: string }
> = {
  blue: {
    text: "text-player-blue",
    border: "border-player-blue",
    bg: "bg-player-blue",
    tint: "bg-player-blue/10",
    glow: "shadow-[0_0_64px_-16px_var(--player-blue)]",
  },
  red: {
    text: "text-player-red",
    border: "border-player-red",
    bg: "bg-player-red",
    tint: "bg-player-red/10",
    glow: "shadow-[0_0_64px_-16px_var(--player-red)]",
  },
};

/** `players[0]` is always blue and `players[1]` red, the same on both screens. */
export function toneForIndex(index: number): PlayerTone {
  return index === 0 ? "blue" : "red";
}
