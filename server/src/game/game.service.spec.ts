import {
  GAME_ONE_FIRST_POINTS,
  GAME_ONE_ROUND_MS,
  GAME_ONE_SECOND_POINTS,
  GameService,
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
      });
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
  });
});
