import { QueueService } from './queue.service.js';

describe('QueueService', () => {
  let service: QueueService;

  beforeEach(() => {
    service = new QueueService();
  });

  it('returns players in the order they joined', () => {
    service.add('a');
    service.add('b');

    expect(service.getOpponent()).toBe('a');
    expect(service.getOpponent()).toBe('b');
  });

  it('returns undefined when the queue is empty', () => {
    expect(service.getOpponent()).toBeUndefined();
  });

  it('takes a player out of the queue once matched', () => {
    service.add('a');

    service.getOpponent();

    expect(service.isInQueue('a')).toBe(false);
  });

  it('removes only the given player', () => {
    service.add('a');
    service.add('b');

    service.remove('a');

    expect(service.isInQueue('a')).toBe(false);
    expect(service.isInQueue('b')).toBe(true);
  });

  it('reports a player that never joined as not queued', () => {
    expect(service.isInQueue('a')).toBe(false);
  });
});
