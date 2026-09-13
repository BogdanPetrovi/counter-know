import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';
import { QueueModule } from '../queue/queue.module.js';

@Module({
  providers: [GameService, GameGateway],
  imports: [QueueModule]
})
export class GameModule {}
