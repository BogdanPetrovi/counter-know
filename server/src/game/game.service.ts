import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UUID } from 'crypto';

export interface GameRoom {
  id: UUID,
  players: string[],
  createdAt: Date
}

@Injectable()
export class GameService {
  private games = new Map<string, GameRoom>();

  createGame(player1: string, player2: string): GameRoom {
    const id = randomUUID();
    const room = {
      id,
      players: [player1, player2],
      createdAt: new Date()
    }

    this.games.set(id, room);
    return room;
  }
}
