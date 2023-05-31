import { Module } from '@nestjs/common'
import { AppService } from './app.service.js'
import { AppGateway } from './app.gateway.js'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller.js'
import { ChatService } from './chat.service.js'
import { ConversationController } from './conversation/conversation.controller.js'
import { PrismaService } from './prisma.service.js'
import { AuthGuard } from './auth.guard.js'
import { LoggerModule } from 'nestjs-pino'
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot(),
    LoggerModule.forRoot({
      pinoHttp: [{ transport: { target: 'pino-pretty' } }, null],
    }),
  ],
  controllers: [AppController, ConversationController],
  providers: [AppService, AppGateway, ChatService, PrismaService, AuthGuard],
})
export class AppModule {
  constructor() {}
}
