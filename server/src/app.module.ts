import { Module } from '@nestjs/common'
import { AppService } from './app.service.js'
import { AppGateway } from './app.gateway.js'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller.js'
import { ChatService } from './services/chat.service.js'
import { ConversationController } from './controllers/conversation.controller.js'
import { PrismaService } from './prisma.service.js'
import { AuthGuard } from './auth.guard.js'
import { CollaborationController } from './controllers/collaboration.controller.js'
import { OpenaiService } from './services/openai.service.js'
import { FileController } from './controllers/file.controller.js'
import { ReplicateService } from './services/replicate.service.js'
@Module({
  imports: [EventEmitterModule.forRoot(), ConfigModule.forRoot()],
  controllers: [
    AppController,
    ConversationController,
    CollaborationController,
    FileController,
  ],
  providers: [
    AppService,
    AppGateway,
    ChatService,
    PrismaService,
    AuthGuard,
    OpenaiService,
    ReplicateService,
  ],
})
export class AppModule {
  constructor() {}
}
