import { Module } from '@nestjs/common';
import { AppService } from './app.service.js';
import { AppGateway } from './app.gateway.js';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [EventEmitterModule.forRoot(), ConfigModule.forRoot()],
  controllers: [],
  providers: [AppService, AppGateway],
})
export class AppModule {}
