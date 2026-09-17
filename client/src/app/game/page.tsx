"use client";

import { useEffect, useState, type AnimationEvent } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/context/GameContext";
import { delay } from "@/components/game/animation";
import { Matchup } from "@/components/game/Matchup";
import { GameOne } from "@/components/game/GameOne";

const READY_AFTER_MS = 4000;

export default function GamePage() {
  const router = useRouter();
  const { status, game, chars, socketId, ready, leaveGame } = useGame();
  // Intro stays mounted until its exit animation finishes, then the round takes its place.
  const [introGone, setIntroGone] = useState(false);

  useEffect(() => {
    if (!game) router.replace("/");
  }, [game, router]);

  useEffect(() => {
    if (status !== "matched") return;
    const t = setTimeout(ready, READY_AFTER_MS);
    return () => clearTimeout(t);
  }, [status, ready]);

  if (!game) return null;

  const opponentLeft = status === "opponent_left";
  const waiting = status === "ready";
  const playing = status === "playing" && chars !== null;
  const introLeaving = playing && !introGone;
  const selfId = socketId ?? game.players[0];
  const opponentId = game.players.find((p) => p !== selfId) ?? game.players[1];

  const onIntroLeft = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setIntroGone(true);
  };

  return (
    <main className="flex flex-1 flex-col px-6 py-30 sm:px-10">
      <div className="mx-auto w-full max-w-3xl">
        {!introGone && (
          <div className={introLeaving ? "leave" : undefined} onAnimationEnd={onIntroLeft}>
            <h1
              className="enter mt-4 text-4xl font-semibold tracking-tight sm:text-5xl"
              style={delay(0.15)}
            >
              {opponentLeft ? "Opponent left." : "Match found."}
            </h1>

            <p className="enter mt-3 font-mono text-xs text-ink-dim" style={delay(0.5)}>
              game / <span className="text-ink">{game.id}</span>
            </p>

            <div className="mt-7">
              <Matchup selfId={selfId} opponentId={opponentId} delay={0.8} />
            </div>

            <div
              className="enter mt-7 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-ink-dim"
              style={delay(1.8)}
            >
              <span>
                state / <span className="text-gold">{game.state}</span>
              </span>
              <span>created / {new Date(game.createdAt).toLocaleTimeString()}</span>
            </div>

            {waiting && (
              <p className="enter caret mt-10 font-mono text-xs text-ink-dim" style={delay(0)}>
                waiting for opponent
              </p>
            )}
          </div>
        )}

        {introGone && !opponentLeft && <GameOne chars={chars!} />}

        {opponentLeft && (
          <div className={`enter ${introGone ? "mt-4" : "mt-14 border-t border-navy-700 pt-8"}`}>
            {introGone && (
              <h1 className="mb-6 text-4xl font-semibold tracking-tight sm:text-5xl">
                Opponent left.
              </h1>
            )}
            <p className="text-ink-dim">
              Your opponent has left the game. This room is gone.
            </p>
            <button
              onClick={leaveGame}
              className="mt-6 cursor-pointer rounded-xl border border-gold px-8 py-4 text-sm font-semibold uppercase tracking-[0.2em] text-gold transition-colors hover:bg-gold hover:text-navy-900"
            >
              Back to lobby
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
