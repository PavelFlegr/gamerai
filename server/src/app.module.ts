import { Module } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppGateway } from './app.gateway.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';

@Module({
  imports: [EventEmitterModule.forRoot(), ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, AppGateway],
})
export class AppModule {}
