import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { AppService } from './app.service.js';
import { Message } from './message.model.js';
import { OnEvent } from '@nestjs/event-emitter';
@WebSocketGateway()
export class AppGateway {
  @WebSocketServer()
  server: Server
  constructor(private appService: AppService) {
  }

  @OnEvent('message')
  handleAIMessage(message: Message) {
    this.server.emit('message', message)
  }
  @SubscribeMessage('message')
  handleMessage(client: Socket, data: Message) {
    this.appService.sendMessage(data)
  }

  @SubscribeMessage('init')
  handleInit() {
    return this.appService.logs
  }
}