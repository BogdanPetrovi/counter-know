"use client";

import { useGame } from "@/context/GameContext";
import { JoinQueueButton } from "@/components/home/JoinQueueButton";
import { QueueStatus } from "@/components/home/QueueStatus";

export default function Home() {
  const { status, error, joinQueue, leaveQueue } = useGame();
  const searching = status === "searching";
  const connecting = status === "connecting";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
      <h1 className="text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl">
        Find opponent
      </h1>

      <div className="mt-10 w-full max-w-72">
        <JoinQueueButton
          searching={searching}
          connecting={connecting}
          onClick={joinQueue}
        />
        <QueueStatus searching={searching} error={error} onLeave={leaveQueue} />
      </div>
    </main>
  );
}
