import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NotificationsService } from './notifications.service';
import { TaskNotificationListener } from './listeners/task-notification.listener';
import mailConfig from '@config/mail.config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule.forFeature(mailConfig)],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const mailConfig = configService.get('mail');
        if (!mailConfig) {
          throw new Error('Missing mail configuration');
        }
        return mailConfig;
      },
    }),
  ],
  providers: [NotificationsService, TaskNotificationListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}