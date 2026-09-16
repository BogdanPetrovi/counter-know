"use client";

import { useGame } from "@/context/GameContext";

export function TopBar() {
  const { status } = useGame();
  const online = status !== "connecting";

  return (
    <header className="flex items-center justify-between border-b border-navy-700 px-6 py-4 sm:px-10">
      <span className="text-sm font-semibold uppercase tracking-[0.25em]">
        Counter<span className="text-gold">Know</span>
      </span>

      <span className="flex items-center gap-2 font-mono text-xs text-ink-dim">
        <span
          className={`inline-block h-1.5 w-1.5 ${online ? "bg-gold" : "bg-ink-dim"}`}
        />
        {online ? "online" : "offline"}
      </span>
    </header>
  );
}
