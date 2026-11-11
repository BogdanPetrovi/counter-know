import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UUID } from 'crypto';
import { PRO_PLAYERS } from '../common/data/pro-players.js';

export const GAME_ONE_ROUND_MS = 30_000;
export const GAME_ONE_FIRST_POINTS = 12;
export const GAME_ONE_SECOND_POINTS = GAME_ONE_FIRST_POINTS / 2;

export interface GameOneSolve {
  playerId: string,
  points: number,
  solvedAt: Date
}

export interface GameOneRound {
  answer: string,
  letters: string[],
  startedAt: Date,
  endsAt: Date,
  solves: GameOneSolve[],
  finished: boolean
}

export interface GameOneState {
  rounds: GameOneRound[]
}

export interface GameRoom {
  id: UUID,
  players: string[],
  createdAt: Date,
  state: "starting" | "game-1",
  ready: Set<string>,
  scores: Record<string, number>,
  gameOne?: GameOneState
}

export interface GameOneRoundStart {
  letters: string[],
  durationMs: number
}

export interface GameOnePlayerResult {
  playerId: string,
  solved: boolean,
  first: boolean,
  points: number,
  timeMs: number | null
}

export interface GameOneRoundSummary {
  answer: string,
  results: GameOnePlayerResult[]
}

export type GameOneAnswerResult =
  | { status: 'correct', answer: string, result: GameOnePlayerResult }
  | { status: 'wrong' }
  | { status: 'rejected', message: string };

type RoundEndListener = (summary: GameOneRoundSummary) => void;

@Injectable()
export class GameService {
  private games = new Map<string, GameRoom>();
  private userGame = new Map<string, UUID>();
  // The round timer is the only source of truth for when a round ends.
  private roundTimers = new Map<UUID, { timer: NodeJS.Timeout, onEnd: RoundEndListener }>();

  createGame(player1: string, player2: string): GameRoom {
    const id = randomUUID();
    const room = {
      id,
      players: [player1, player2],
      createdAt: new Date(),
      state: "starting" as const,
      ready: new Set<string>(),
      scores: { [player1]: 0, [player2]: 0 }
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

  getGame(gameId: UUID): GameRoom | undefined {
    return this.games.get(gameId);
  }

  removeGame(gameId: UUID) {
    this.clearRoundTimer(gameId);

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

  startGameOne(gameId: UUID, onRoundEnd: RoundEndListener): GameOneRoundStart | undefined {
    const game = this.games.get(gameId);
    if(!game) {
      return undefined;
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

    const startedAt = new Date();
    game.gameOne = {
      rounds: [{
        answer: randomPlayer,
        letters: finalArr,
        startedAt,
        endsAt: new Date(startedAt.getTime() + GAME_ONE_ROUND_MS),
        solves: [],
        finished: false
      }]
    };

    this.clearRoundTimer(gameId);
    const timer = setTimeout(() => this.finishGameOneRound(gameId), GAME_ONE_ROUND_MS);
    this.roundTimers.set(gameId, { timer, onEnd: onRoundEnd });

    return { letters: finalArr, durationMs: GAME_ONE_ROUND_MS };
  }

  getCurrentGameOneRound(gameId: UUID): GameOneRound | undefined {
    const game = this.games.get(gameId);
    return game?.gameOne?.rounds.at(-1);
  }

  submitGameOneAnswer(gameId: UUID, playerId: string, answer: string): GameOneAnswerResult {
    const game = this.games.get(gameId);
    const round = this.getCurrentGameOneRound(gameId);
    if(!game || game.state !== 'game-1' || !round) {
      return { status: 'rejected', message: 'No round in progress.' };
    }

    if(round.finished || Date.now() >= round.endsAt.getTime()) {
      return { status: 'rejected', message: 'The round is over.' };
    }

    if(round.solves.some((s) => s.playerId === playerId)) {
      return { status: 'rejected', message: 'You already solved this round.' };
    }

    if(answer.trim().toUpperCase() !== round.answer.toUpperCase()) {
      return { status: 'wrong' };
    }

    const points = round.solves.length === 0 ? GAME_ONE_FIRST_POINTS : GAME_ONE_SECOND_POINTS;
    round.solves.push({ playerId, points, solvedAt: new Date() });
    game.scores[playerId] = (game.scores[playerId] ?? 0) + points;

    if(round.solves.length === game.players.length) {
      this.finishGameOneRound(gameId);
    }

    // The player already knows the answer, so it is safe to reveal its real spelling now.
    return { status: 'correct', answer: round.answer, result: this.playerResult(round, playerId) };
  }

  private finishGameOneRound(gameId: UUID) {
    const game = this.games.get(gameId);
    const round = this.getCurrentGameOneRound(gameId);
    const listener = this.roundTimers.get(gameId)?.onEnd;
    this.clearRoundTimer(gameId);

    if(!game || !round || round.finished) {
      return;
    }
    round.finished = true;

    const results = game.players.map((playerId) => this.playerResult(round, playerId));
    listener?.({ answer: round.answer, results });
  }

  private playerResult(round: GameOneRound, playerId: string): GameOnePlayerResult {
    const solve = round.solves.find((s) => s.playerId === playerId);
    return {
      playerId,
      solved: !!solve,
      first: round.solves[0]?.playerId === playerId,
      points: solve?.points ?? 0,
      timeMs: solve ? solve.solvedAt.getTime() - round.startedAt.getTime() : null
    };
  }

  private clearRoundTimer(gameId: UUID) {
    const entry = this.roundTimers.get(gameId);
    if(entry) {
      clearTimeout(entry.timer);
      this.roundTimers.delete(gameId);
    }
  }
}
