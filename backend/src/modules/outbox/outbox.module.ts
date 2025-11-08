import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxService } from './outbox.service';
import { OutboxMessage } from './entities/outbox-message.entity';
import { RabbitMQService } from '@common/rabbitmq/rabbitmq.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OutboxMessage]),
    ScheduleModule.forRoot(),
  ],
  providers: [OutboxService, RabbitMQService],
  exports: [OutboxService],
})
export class OutboxModule {}