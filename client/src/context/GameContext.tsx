"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";

export interface GameRoom {
  id: string;
  players: string[];
  createdAt: string;
  state: "starting" | "game-1";
  message: string;
}

export type GameStatus =
  | "connecting"
  | "idle"
  | "searching"
  | "matched"
  | "opponent_left";

interface GameContextValue {
  status: GameStatus;
  socketId: string | null;
  game: GameRoom | null;
  error: string | null;
  joinQueue: () => void;
  leaveQueue: () => void;
  leaveGame: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<GameStatus>("connecting");
  const [socketId, setSocketId] = useState<string | null>(null);
  const [game, setGame] = useState<GameRoom | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setSocketId(socket.id ?? null);
      setStatus("idle");
      setError(null);
    };

    const onDisconnect = () => {
      setSocketId(null);
      setGame(null);
      setStatus("connecting");
    };

    const onQueueError = (payload: { message: string }) => {
      setError(payload.message);
      setStatus("idle");
    };

    const onMatchFound = (payload: GameRoom) => {
      setGame(payload);
      setError(null);
      setStatus("matched");
      router.push("/game");
    };

    const onOpponentDisconnected = () => {
      setStatus("opponent_left");
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("queue_error", onQueueError);
    socket.on("match_found", onMatchFound);
    socket.on("opponent_disconnected", onOpponentDisconnected);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("queue_error", onQueueError);
      socket.off("match_found", onMatchFound);
      socket.off("opponent_disconnected", onOpponentDisconnected);
    };
  }, [router]);

  const joinQueue = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected) return;
    setError(null);
    setGame(null);
    setStatus("searching");
    socket.emit("join_queue");
  }, []);

  const leaveQueue = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit("leave_queue");
    setStatus("idle");
  }, []);

  const leaveGame = useCallback(() => {
    setGame(null);
    setError(null);
    setStatus("idle");
    router.push("/");
  }, [router]);

  return (
    <GameContext.Provider
      value={{ status, socketId, game, error, joinQueue, leaveQueue, leaveGame }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
