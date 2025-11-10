import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { validationSchema } from './config/validation.config';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

import { AuthModule } from './modules/auth/auth.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RabbitmqService } from './common/rabbitmq/rabbitmq.service';
import { OutboxModule } from './modules/outbox/outbox.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { InboxModule } from './modules/inbox/inbox.module';
import { DlqModule } from './modules/dlq/dlq.module';
import { EventStoreModule } from './modules/event-store/event-store.module';
import { RealtimeGateway } from './modules/realtime/realtime.gateway';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SagaModule } from './modules/saga/saga.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validationSchema,
      envFilePath: ['.env'],
    }),
    RealtimeModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const databaseConfig = await configService.get('database');
        return {
          ...databaseConfig,
          // add any additional options here
        };
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI')!
      })
    }),

    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
    }),

    AuthModule,
    TasksModule,
    ProjectsModule,
    AuditModule,
    NotificationsModule,
    OutboxModule,
    WebhooksModule,
    InboxModule,
    DlqModule,
    EventStoreModule,
    RealtimeModule,
    SagaModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    RabbitmqService,
    RealtimeGateway,
  ],
})
export class AppModule {}