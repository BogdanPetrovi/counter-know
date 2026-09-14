import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UUID } from 'crypto';

export interface GameRoom {
  id: UUID,
  players: string[],
  createdAt: Date,
  state: "starting" | "game-1"
}

@Injectable()
export class GameService {
  private games = new Map<string, GameRoom>();
  private userGame = new Map<string, UUID>();

  createGame(player1: string, player2: string): GameRoom {
    const id = randomUUID();
    const room = {
      id,
      players: [player1, player2],
      createdAt: new Date(),
      state: "starting" as const
    };

    this.games.set(id, room);
    this.userGame.set(player1, id);
    this.userGame.set(player2, id);
    return room;
  }

  isInGame(userId: string): boolean {
    return this.userGame.has(userId);
  }

  getRoomIdForPlayer(userId: string): UUID | undefined {
    return this.userGame.get(userId);
  }

  removeGame(gameId: UUID) {
    const room = this.games.get(gameId);
    if(room) {
      room.players.forEach((p) => this.userGame.delete(p));
      this.games.delete(gameId);
    }
  }
}
