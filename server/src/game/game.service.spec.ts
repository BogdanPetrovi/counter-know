import {
  GAME_END_DELAY_MS,
  GAME_ONE_FIRST_POINTS,
  GAME_ONE_LETTERS,
  GAME_ONE_ROUND_BREAK_MS,
  GAME_ONE_ROUND_MS,
  GAME_ONE_ROUNDS,
  GAME_ONE_SECOND_POINTS,
  GameService,
  type GameEndSummary,
  type GameOneRoundStart,
  type GameOneRoundSummary,
} from './game.service.js';
import type { UUID } from 'crypto';

describe('GameService', () => {
  let service: GameService;

  beforeEach(() => {
    service = new GameService();
  });

  describe('game one', () => {
    let gameId: UUID;
    let answer: string;
    let onRoundStart: ReturnType<typeof vi.fn<(round: GameOneRoundStart) => void>>;
    let onRoundEnd: ReturnType<typeof vi.fn<(summary: GameOneRoundSummary) => void>>;
    let onGameEnd: ReturnType<typeof vi.fn<(summary: GameEndSummary) => void>>;

    const currentAnswer = () => service.getCurrentGameOneRound(gameId)!.answer;

    /** Lets the current round run out, then waits through the break. */
    const finishRoundAndBreak = () => {
      vi.advanceTimersByTime(GAME_ONE_ROUND_MS + GAME_ONE_ROUND_BREAK_MS);
    };

    beforeEach(() => {
      vi.useFakeTimers();
      gameId = service.createGame('a', 'b').id;
      onRoundStart = vi.fn<(round: GameOneRoundStart) => void>();
      onRoundEnd = vi.fn<(summary: GameOneRoundSummary) => void>();
      onGameEnd = vi.fn<(summary: GameEndSummary) => void>();
      service.startGameOne(gameId, { onRoundStart, onRoundEnd, onGameEnd });
      answer = currentAnswer();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('round', () => {
      it('starts the first round right away', () => {
        expect(onRoundStart).toHaveBeenCalledTimes(1);
        expect(onRoundStart).toHaveBeenCalledWith({
          round: 1,
          totalRounds: GAME_ONE_ROUNDS,
          letters: expect.any(Array),
          durationMs: GAME_ONE_ROUND_MS,
        });
      });

      it('deals every letter of the answer among the tiles', () => {
        const { letters } = onRoundStart.mock.calls[0][0];
        const pool = [...letters];

        expect(letters).toHaveLength(GAME_ONE_LETTERS);
        for(const char of answer.toUpperCase()) {
          const at = pool.indexOf(char);
          expect(at).toBeGreaterThanOrEqual(0);
          pool.splice(at, 1);
        }
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
          round: 1,
          totalRounds: GAME_ONE_ROUNDS,
          answer,
          results: [
            { playerId: 'a', solved: true, first: true, points: GAME_ONE_FIRST_POINTS, timeMs: 4_000 },
            { playerId: 'b', solved: true, first: false, points: GAME_ONE_SECOND_POINTS, timeMs: 6_500 },
          ],
          scores: { a: GAME_ONE_FIRST_POINTS, b: GAME_ONE_SECOND_POINTS },
          nextInMs: GAME_ONE_ROUND_BREAK_MS,
        });

        // The cancelled round timer never ends the same round a second time.
        vi.advanceTimersByTime(GAME_ONE_ROUND_MS);
        expect(onRoundEnd.mock.calls.filter(([s]) => s.round === 1)).toHaveLength(1);
      });

      it('ends the round when the server timer runs out', () => {
        service.submitGameOneAnswer(gameId, 'a', answer);

        vi.advanceTimersByTime(GAME_ONE_ROUND_MS - 1);
        expect(onRoundEnd).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onRoundEnd).toHaveBeenCalledWith({
          round: 1,
          totalRounds: GAME_ONE_ROUNDS,
          answer,
          results: [
            { playerId: 'a', solved: true, first: true, points: GAME_ONE_FIRST_POINTS, timeMs: 0 },
            { playerId: 'b', solved: false, first: false, points: 0, timeMs: null },
          ],
          scores: { a: GAME_ONE_FIRST_POINTS, b: 0 },
          nextInMs: GAME_ONE_ROUND_BREAK_MS,
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

    describe('next round', () => {
      it('starts the second round once the break after the first result is over', () => {
        vi.advanceTimersByTime(GAME_ONE_ROUND_MS);
        vi.advanceTimersByTime(GAME_ONE_ROUND_BREAK_MS - 1);
        expect(onRoundStart).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(1);
        expect(onRoundStart).toHaveBeenCalledTimes(2);
        expect(onRoundStart).toHaveBeenLastCalledWith({
          round: 2,
          totalRounds: GAME_ONE_ROUNDS,
          letters: expect.any(Array),
          durationMs: GAME_ONE_ROUND_MS,
        });
      });

      it('picks a different pro player for the second round', () => {
        finishRoundAndBreak();

        expect(currentAnswer()).not.toBe(answer);
      });

      it('lets both players answer again in the second round', () => {
        service.submitGameOneAnswer(gameId, 'a', answer);
        finishRoundAndBreak();

        const result = service.submitGameOneAnswer(gameId, 'a', currentAnswer());
        expect(result.status === 'correct' && result.result).toMatchObject({ first: true, points: GAME_ONE_FIRST_POINTS });
      });

      it('keeps adding to the same game score', () => {
        service.submitGameOneAnswer(gameId, 'a', answer);
        finishRoundAndBreak();
        service.submitGameOneAnswer(gameId, 'b', currentAnswer());
        service.submitGameOneAnswer(gameId, 'a', currentAnswer());

        expect(onRoundEnd).toHaveBeenLastCalledWith(expect.objectContaining({
          round: 2,
          scores: { a: GAME_ONE_FIRST_POINTS + GAME_ONE_SECOND_POINTS, b: GAME_ONE_FIRST_POINTS },
        }));
      });

      it('does not start the next round of a game removed during the break', () => {
        vi.advanceTimersByTime(GAME_ONE_ROUND_MS);
        service.removeGame(gameId);
        vi.advanceTimersByTime(GAME_ONE_ROUND_BREAK_MS);

        expect(onRoundStart).toHaveBeenCalledTimes(1);
      });
    });

    describe('game end', () => {
      /** Round 1 to `a`, round 2 to `b` first and `a` second. */
      const playBothRounds = () => {
        service.submitGameOneAnswer(gameId, 'a', answer);
        finishRoundAndBreak();
        service.submitGameOneAnswer(gameId, 'b', currentAnswer());
        service.submitGameOneAnswer(gameId, 'a', currentAnswer());
      };

      it('plays exactly the configured number of rounds', () => {
        for(let i = 0; i < GAME_ONE_ROUNDS + 1; i++) {
          finishRoundAndBreak();
        }

        expect(onRoundStart).toHaveBeenCalledTimes(GAME_ONE_ROUNDS);
        expect(onRoundEnd).toHaveBeenCalledTimes(GAME_ONE_ROUNDS);
      });

      it('announces the game end pause with the last round result', () => {
        playBothRounds();

        expect(onRoundEnd).toHaveBeenLastCalledWith(expect.objectContaining({
          round: GAME_ONE_ROUNDS,
          nextInMs: GAME_END_DELAY_MS,
        }));
      });

      it('does not end the game after the first round', () => {
        vi.advanceTimersByTime(GAME_ONE_ROUND_MS + GAME_END_DELAY_MS);

        expect(onGameEnd).not.toHaveBeenCalled();
        expect(service.isInGame('a')).toBe(true);
      });

      it('names the player with more points as the winner after the pause', () => {
        playBothRounds();

        vi.advanceTimersByTime(GAME_END_DELAY_MS - 1);
        expect(onGameEnd).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onGameEnd).toHaveBeenCalledTimes(1);
        expect(onGameEnd).toHaveBeenCalledWith({
          winnerId: 'a',
          scores: { a: GAME_ONE_FIRST_POINTS + GAME_ONE_SECOND_POINTS, b: GAME_ONE_FIRST_POINTS },
        });
      });

      it('has no winner when both players finish level', () => {
        finishRoundAndBreak();
        vi.advanceTimersByTime(GAME_ONE_ROUND_MS + GAME_END_DELAY_MS);

        expect(onGameEnd).toHaveBeenCalledWith({ winnerId: null, scores: { a: 0, b: 0 } });
      });

      it('removes the game so both players can queue again', () => {
        finishRoundAndBreak();
        vi.advanceTimersByTime(GAME_ONE_ROUND_MS + GAME_END_DELAY_MS);

        expect(service.getGame(gameId)).toBeUndefined();
        expect(service.isInGame('a')).toBe(false);
        expect(service.isInGame('b')).toBe(false);
      });

      it('does not end a game that was removed during the pause', () => {
        finishRoundAndBreak();
        vi.advanceTimersByTime(GAME_ONE_ROUND_MS);
        service.removeGame(gameId);
        vi.advanceTimersByTime(GAME_END_DELAY_MS);

        expect(onGameEnd).not.toHaveBeenCalled();
      });
    });
  });
});
