import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { UUID } from 'crypto';
import { PRO_PLAYERS } from '../common/data/pro-players.js';

export const GAME_ONE_ROUNDS = 2;
export const GAME_ONE_ROUND_MS = 30_000;
export const GAME_ONE_LETTERS = 12;
export const GAME_ONE_FIRST_POINTS = 12;
export const GAME_ONE_SECOND_POINTS = GAME_ONE_FIRST_POINTS / 2;
/** Pause between a round result and the next round, so players can read the result first. */
export const GAME_ONE_ROUND_BREAK_MS = 6_000;
/** Pause between the last round result and the game end, so players can read the result first. */
export const GAME_END_DELAY_MS = 6_000;

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
  /** 1-based. */
  round: number,
  totalRounds: number,
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

/** Total points per player id for the whole game. Always a full snapshot, never a delta. */
export type GameScores = Record<string, number>;

export interface GameOneRoundSummary {
  /** 1-based. */
  round: number,
  totalRounds: number,
  answer: string,
  results: GameOnePlayerResult[],
  scores: GameScores,
  /** Pause until the next round starts, or until the game ends after the last round. */
  nextInMs: number
}

export type GameOneAnswerResult =
  | { status: 'correct', answer: string, result: GameOnePlayerResult, scores: GameScores }
  | { status: 'wrong' }
  | { status: 'rejected', message: string };

export interface GameEndSummary {
  /** `null` when both players finish on the same score. */
  winnerId: string | null,
  scores: GameScores
}

type GameEndListener = (summary: GameEndSummary) => void;

/** The service drives the whole game one timeline; the gateway only relays it to the room. */
export interface GameOneListeners {
  onRoundStart: (round: GameOneRoundStart) => void,
  onRoundEnd: (summary: GameOneRoundSummary) => void,
  /** Game one is the whole match for now, so its last round also ends the game. */
  onGameEnd: GameEndListener
}

@Injectable()
export class GameService {
  private games = new Map<string, GameRoom>();
  private userGame = new Map<string, UUID>();
  // The round timer is the only source of truth for when a round ends.
  private roundTimers = new Map<UUID, { timer: NodeJS.Timeout, listeners: GameOneListeners }>();
  // The break before the next round or the game end. A game never has more than one pending.
  private pauseTimers = new Map<UUID, NodeJS.Timeout>();

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
    this.clearPauseTimer(gameId);

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

  /**
   * Plays all `GAME_ONE_ROUNDS` rounds, with a break after each result, then ends the game.
   * The first round starts right away. Removing the game stops the timeline at any point.
   */
  startGameOne(gameId: UUID, listeners: GameOneListeners) {
    const game = this.games.get(gameId);
    if(!game) {
      return;
    }

    game.state = 'game-1';
    game.gameOne = { rounds: [] };
    this.startGameOneRound(gameId, listeners);
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
    // When this solve ended the round, the round end is emitted before this ack, so both carry a full snapshot.
    return {
      status: 'correct',
      answer: round.answer,
      result: this.playerResult(round, playerId),
      scores: { ...game.scores }
    };
  }

  /** Ends the game after `GAME_END_DELAY_MS`. Removing the game first cancels it. */
  private scheduleGameEnd(gameId: UUID, onEnd: GameEndListener) {
    this.schedulePause(gameId, GAME_END_DELAY_MS, () => {
      const summary = this.endGame(gameId);
      if(summary) {
        onEnd(summary);
      }
    });
  }

  /** Final result of the game. The room is removed, so both players can queue again. */
  endGame(gameId: UUID): GameEndSummary | undefined {
    const game = this.games.get(gameId);
    if(!game) {
      return undefined;
    }

    const summary = { winnerId: this.winnerOf(game), scores: { ...game.scores } };
    this.removeGame(gameId);
    return summary;
  }

  private winnerOf(game: GameRoom): string | null {
    const [first, second] = game.players;
    const diff = (game.scores[first] ?? 0) - (game.scores[second] ?? 0);
    if(diff === 0) {
      return null;
    }

    return diff > 0 ? first : second;
  }

  private startGameOneRound(gameId: UUID, listeners: GameOneListeners) {
    const game = this.games.get(gameId);
    if(!game?.gameOne) {
      return;
    }

    const rounds = game.gameOne.rounds;
    const answer = this.pickAnswer(rounds.map((r) => r.answer));
    const letters = this.scramble(answer);
    const startedAt = new Date();
    rounds.push({
      answer,
      letters,
      startedAt,
      endsAt: new Date(startedAt.getTime() + GAME_ONE_ROUND_MS),
      solves: [],
      finished: false
    });

    this.clearRoundTimer(gameId);
    const timer = setTimeout(() => this.finishGameOneRound(gameId), GAME_ONE_ROUND_MS);
    this.roundTimers.set(gameId, { timer, listeners });

    listeners.onRoundStart({
      round: rounds.length,
      totalRounds: GAME_ONE_ROUNDS,
      letters,
      durationMs: GAME_ONE_ROUND_MS
    });
  }

  private finishGameOneRound(gameId: UUID) {
    const game = this.games.get(gameId);
    const round = this.getCurrentGameOneRound(gameId);
    const listeners = this.roundTimers.get(gameId)?.listeners;
    this.clearRoundTimer(gameId);

    if(!game?.gameOne || !round || round.finished) {
      return;
    }
    round.finished = true;

    if(!listeners) {
      return;
    }

    const number = game.gameOne.rounds.length;
    const last = number >= GAME_ONE_ROUNDS;
    const results = game.players.map((playerId) => this.playerResult(round, playerId));
    listeners.onRoundEnd({
      round: number,
      totalRounds: GAME_ONE_ROUNDS,
      answer: round.answer,
      results,
      scores: { ...game.scores },
      nextInMs: last ? GAME_END_DELAY_MS : GAME_ONE_ROUND_BREAK_MS
    });

    if(last) {
      this.scheduleGameEnd(gameId, listeners.onGameEnd);
    } else {
      this.schedulePause(gameId, GAME_ONE_ROUND_BREAK_MS, () => this.startGameOneRound(gameId, listeners));
    }
  }

  /** A random pro player that has not been an answer in this game yet. */
  private pickAnswer(used: string[]): string {
    const fresh = PRO_PLAYERS.filter((p) => !used.includes(p));
    const pool = fresh.length > 0 ? fresh : PRO_PLAYERS;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /** The answer's letters padded with random ones up to `GAME_ONE_LETTERS`, shuffled and upper-cased. */
  private scramble(answer: string): string[] {
    const chars = [...answer];
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    while(chars.length < GAME_ONE_LETTERS) {
      chars.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
    }

    const letters: string[] = [];
    while(chars.length > 0) {
      const char = chars.splice(Math.floor(Math.random() * chars.length), 1)[0];
      letters.push(char.toUpperCase());
    }
    return letters;
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

  /** Runs `fn` after `ms`, unless the game is removed first. Replaces any pause still pending. */
  private schedulePause(gameId: UUID, ms: number, fn: () => void) {
    if(!this.games.has(gameId)) {
      return;
    }

    this.clearPauseTimer(gameId);
    const timer = setTimeout(() => {
      this.pauseTimers.delete(gameId);
      fn();
    }, ms);
    this.pauseTimers.set(gameId, timer);
  }

  private clearPauseTimer(gameId: UUID) {
    const timer = this.pauseTimers.get(gameId);
    if(timer) {
      clearTimeout(timer);
      this.pauseTimers.delete(gameId);
    }
  }
}
