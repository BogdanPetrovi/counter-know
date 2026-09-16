import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UUID } from 'crypto';
import { PRO_PLAYERS } from '../common/data/pro-players.js';

export interface GameRoom {
  id: UUID,
  players: string[],
  createdAt: Date,
  state: "starting" | "game-1",
  ready: Set<string>
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
      state: "starting" as const,
      ready: new Set<string>()
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

  markReady(gameId: UUID, userId: string): boolean {
    const game = this.games.get(gameId);
    if(!game || game.state !== 'starting') {
      return false;
    }

    game.ready.add(userId);
    if(game.ready.size === 2) {
      return true;
    }

    return false;
  }

  startGameOne(gameId: UUID): Array<string> {
    const game = this.games.get(gameId);
    if(!game) {
      return []
    }
    game.state = 'game-1';

    const playersArrayLength = PRO_PLAYERS.length;
    const randomNumber = Math.floor(Math.random() * playersArrayLength);
    const randomPlayer = PRO_PLAYERS[randomNumber];

    const charArr = [...randomPlayer];

    const randomCharNumber = 12 - charArr.length;
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    for (let index = 0; index < randomCharNumber; index++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      charArr.push(chars[randomIndex]);
    }

    const finalArr = [];
    for(let index = 0; index < 12; index++) {
      const randomIndex = Math.floor(Math.random() * charArr.length);
      const char = charArr.splice(randomIndex, 1)[0];
      finalArr.push(char.toUpperCase());
    }

    return finalArr;
  }
}
