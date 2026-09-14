import { Injectable } from '@nestjs/common';

@Injectable()
export class QueueService {
  private queue: Array<string> = []

  add(clientId: string): void {
    this.queue.push(clientId);
  }

  remove(clientId: string): void {
    this.queue = this.queue.filter(id => id !== clientId);
  }

  isInQueue(clientId: string): boolean {
    return this.queue.includes(clientId);
  }

  getOpponent(): string | undefined {
    return this.queue.shift();
  }
}