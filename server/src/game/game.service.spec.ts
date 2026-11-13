import {
  GAME_END_DELAY_MS,
  GAME_ONE_FIRST_POINTS,
  GAME_ONE_ROUND_MS,
  GAME_ONE_SECOND_POINTS,
  GameService,
  type GameEndSummary,
  type GameOneRoundSummary,
} from './game.service.js';
import type { UUID } from 'crypto';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService();
  });

  describe('game one round', () => {
    let gameId: UUID;
    let answer: string;
    let onRoundEnd: ReturnType<typeof vi.fn<(summary: GameOneRoundSummary) => void>>;

    beforeEach(() => {
      vi.useFakeTimers();
      gameId = service.createGame('a', 'b').id;
      onRoundEnd = vi.fn<(summary: GameOneRoundSummary) => void>();
      service.startGameOne(gameId, onRoundEnd);
      answer = service.getCurrentGameOneRound(gameId)!.answer;
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('rejects a wrong answer without ending the round', () => {
      expect(service.submitGameOneAnswer(gameId, 'a', 'definitely-wrong')).toEqual({ status: 'wrong' });
      expect(onRoundEnd).not.toHaveBeenCalled();
    });

    it('accepts the answer regardless of letter case', () => {
      const result = service.submitGameOneAnswer(gameId, 'a', answer.toUpperCase());

      expect(result.status).toBe('correct');
    });

    it('reveals the real answer and the solver result with a correct answer', () => {
      vi.advanceTimersByTime(3_200);

      expect(service.submitGameOneAnswer(gameId, 'a', answer.toLowerCase())).toEqual({
        status: 'correct',
        answer,
        result: { playerId: 'a', solved: true, first: true, points: GAME_ONE_FIRST_POINTS, timeMs: 3_200 },
        scores: { a: GAME_ONE_FIRST_POINTS, b: 0 },
      });
    });

    it('sends a score snapshot that does not change when the game scores do', () => {
      const result = service.submitGameOneAnswer(gameId, 'a', answer);
      service.submitGameOneAnswer(gameId, 'b', answer);

      expect(result.status === 'correct' && result.scores).toEqual({ a: GAME_ONE_FIRST_POINTS, b: 0 });
    });

    it('gives the first solver full points and the second one half', () => {
      const first = service.submitGameOneAnswer(gameId, 'b', answer);
      const second = service.submitGameOneAnswer(gameId, 'a', answer);

      expect(first.status === 'correct' && first.result).toMatchObject({ first: true, points: GAME_ONE_FIRST_POINTS });
      expect(second.status === 'correct' && second.result).toMatchObject({ first: false, points: GAME_ONE_SECOND_POINTS });

      expect(service.getGame(gameId)!.scores).toEqual({
        a: GAME_ONE_SECOND_POINTS,
        b: GAME_ONE_FIRST_POINTS,
      });
    });

    it('records who solved first', () => {
      service.submitGameOneAnswer(gameId, 'b', answer);
      service.submitGameOneAnswer(gameId, 'a', answer);

      const solves = service.getCurrentGameOneRound(gameId)!.solves;
      expect(solves.map((s) => s.playerId)).toEqual(['b', 'a']);
    });

    it('does not let a player score twice in one round', () => {
      service.submitGameOneAnswer(gameId, 'a', answer);

      expect(service.submitGameOneAnswer(gameId, 'a', answer).status).toBe('rejected');
      expect(service.getGame(gameId)!.scores.a).toBe(GAME_ONE_FIRST_POINTS);
    });

    it('ends the round as soon as both players solve it', () => {
      vi.advanceTimersByTime(4_000);
      service.submitGameOneAnswer(gameId, 'a', answer);
      vi.advanceTimersByTime(2_500);
      service.submitGameOneAnswer(gameId, 'b', answer);

      expect(onRoundEnd).toHaveBeenCalledTimes(1);
      expect(onRoundEnd).toHaveBeenCalledWith({
        answer,
        results: [
          { playerId: 'a', solved: true, first: true, points: GAME_ONE_FIRST_POINTS, timeMs: 4_000 },
          { playerId: 'b', solved: true, first: false, points: GAME_ONE_SECOND_POINTS, timeMs: 6_500 },
        ],
        scores: { a: GAME_ONE_FIRST_POINTS, b: GAME_ONE_SECOND_POINTS },
      });

      vi.advanceTimersByTime(GAME_ONE_ROUND_MS);
      expect(onRoundEnd).toHaveBeenCalledTimes(1);
    });

    it('ends the round when the server timer runs out', () => {
      service.submitGameOneAnswer(gameId, 'a', answer);

      vi.advanceTimersByTime(GAME_ONE_ROUND_MS - 1);
      expect(onRoundEnd).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(onRoundEnd).toHaveBeenCalledWith({
        answer,
        results: [
          { playerId: 'a', solved: true, first: true, points: GAME_ONE_FIRST_POINTS, timeMs: 0 },
          { playerId: 'b', solved: false, first: false, points: 0, timeMs: null },
        ],
        scores: { a: GAME_ONE_FIRST_POINTS, b: 0 },
      });
    });

    it('rejects answers once the round is over', () => {
      vi.advanceTimersByTime(GAME_ONE_ROUND_MS);

      expect(service.submitGameOneAnswer(gameId, 'b', answer).status).toBe('rejected');
      expect(service.getGame(gameId)!.scores.b).toBe(0);
    });

    it('stops the round timer when the game is removed', () => {
      service.removeGame(gameId);
      vi.advanceTimersByTime(GAME_ONE_ROUND_MS);

      expect(onRoundEnd).not.toHaveBeenCalled();
    });

    describe('game end', () => {
      let onGameEnd: ReturnType<typeof vi.fn<(summary: GameEndSummary) => void>>;

      beforeEach(() => {
        onGameEnd = vi.fn<(summary: GameEndSummary) => void>();
      });

      it('names the player with more points as the winner after the pause', () => {
        service.submitGameOneAnswer(gameId, 'b', answer);
        service.submitGameOneAnswer(gameId, 'a', answer);
        service.scheduleGameEnd(gameId, onGameEnd);

        vi.advanceTimersByTime(GAME_END_DELAY_MS - 1);
        expect(onGameEnd).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onGameEnd).toHaveBeenCalledTimes(1);
        expect(onGameEnd).toHaveBeenCalledWith({
          winnerId: 'b',
          scores: { a: GAME_ONE_SECOND_POINTS, b: GAME_ONE_FIRST_POINTS },
        });
      });

      it('has no winner when both players finish level', () => {
        vi.advanceTimersByTime(GAME_ONE_ROUND_MS);
        service.scheduleGameEnd(gameId, onGameEnd);
        vi.advanceTimersByTime(GAME_END_DELAY_MS);

        expect(onGameEnd).toHaveBeenCalledWith({ winnerId: null, scores: { a: 0, b: 0 } });
      });

      it('removes the game so both players can queue again', () => {
        service.scheduleGameEnd(gameId, onGameEnd);
        vi.advanceTimersByTime(GAME_END_DELAY_MS);

        expect(service.getGame(gameId)).toBeUndefined();
        expect(service.isInGame('a')).toBe(false);
        expect(service.isInGame('b')).toBe(false);
      });

      it('does not end a game that was removed during the pause', () => {
        service.scheduleGameEnd(gameId, onGameEnd);
        service.removeGame(gameId);
        vi.advanceTimersByTime(GAME_END_DELAY_MS);

        expect(onGameEnd).not.toHaveBeenCalled();
      });
    });
  });
});
