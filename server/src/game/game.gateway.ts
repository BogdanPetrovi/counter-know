import { OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from 'socket.io'
import { QueueService } from "../queue/queue.service.js";
import { GameService } from "./game.service.js";

@WebSocketGateway()
export class GameGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly queueService: QueueService,
    private readonly gameService: GameService
  ) {}

  @SubscribeMessage('join_queue') 
  handleJoinQueue(client: Socket) {
    if(this.queueService.isInQueue(client.id)) {
      return client.emit('queue_error', {
        message: 'You are already in the queue.'
      });
    }

    if(this.gameService.isInGame(client.id)) {
      return client.emit('queue_error', {
        message: 'You are already in the game.'
      });
    }

    const opponentId = this.queueService.getOpponent();
    if(!opponentId){ 
      return this.queueService.add(client.id);
    }

    const opponent = this.server.sockets.sockets.get(opponentId);
    if(!opponent){
      return this.queueService.add(client.id);
    }

    const game = this.gameService.createGame(opponent.id, client.id);
    client.join(game.id);
    opponent.join(game.id);
    this.server.to(game.id).emit('match_found', {
      ...game,
      message: 'Match found'
    });
  }

  @SubscribeMessage('leave_queue')
  handleLeaveQueue(client: Socket) {
    if(!this.queueService.isInQueue(client.id)) {
      return client.emit('queue_error', {
        message: 'You are not in the queue.'
      });
    }

    this.queueService.remove(client.id);
  }

  @SubscribeMessage('player_ready')
  handlePlayerReady(client: Socket) {
    if(this.queueService.isInQueue(client.id)) {
      return client.emit('queue_error', {
        message: 'You are in the queue.'
      });
    }

    const roomId = this.gameService.getRoomIdForPlayer(client.id);
    if(!roomId) {
      return client.emit('queue_error', {
        message: 'You are not in a game.'
      });
    }

    const bothReady = this.gameService.markReady(roomId, client.id);
    if(bothReady) {
      const char = this.gameService.startGameOne(roomId);
      this.server.to(roomId).emit('game_one_start', { char });
    }
  }

  handleDisconnect(client: Socket) {
    this.queueService.remove(client.id);

    const roomId = this.gameService.getRoomIdForPlayer(client.id);
    if(roomId) {
      this.server.to(roomId).emit('opponent_disconnected', {
        message: "Your opponent has left the game."
      });
      this.gameService.removeGame(roomId);
    }
  }
}