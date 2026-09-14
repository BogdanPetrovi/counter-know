import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GameModule } from './game/game.module.js';
import { QueueModule } from './queue/queue.module.js';

@Module({
  imports: [
    GameModule,
    QueueModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
