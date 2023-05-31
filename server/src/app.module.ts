import { Module, OnModuleInit } from '@nestjs/common'
import { AppService } from './app.service.js'
import { AppGateway } from './app.gateway.js'
import { EventEmitterModule } from '@nestjs/event-emitter'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller.js'
import { ChatService } from './chat.service.js'
import { LoggerModule } from 'nestjs-pino'
import { MikroOrmModule } from '@mikro-orm/nestjs'
import { TsMorphMetadataProvider } from '@mikro-orm/reflection'
import { Conversation } from './model/entities/conversation.js'
import { MikroORM } from '@mikro-orm/core'
import { Message } from './model/entities/message.js'
import { ConversationController } from './conversation/conversation.controller.js'
import { User } from './model/entities/user.js'
import { SqlService } from './sql.service.js'
@Module({
  imports: [
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot(),
    LoggerModule.forRoot(),
    MikroOrmModule.forRoot({
      autoLoadEntities: true,
      type: 'postgresql',
      dbName: 'assistant',
      metadataProvider: TsMorphMetadataProvider,
      password: 'postgres',
    }),
    MikroOrmModule.forFeature([Conversation, User, Message]),
  ],
  controllers: [AppController, ConversationController],
  providers: [AppService, AppGateway, ChatService, SqlService],
})
export class AppModule implements OnModuleInit {
  constructor(private orm: MikroORM) {}
  async onModuleInit() {
    await this.orm.getSchemaGenerator().updateSchema({ dropTables: false })
  }
}
