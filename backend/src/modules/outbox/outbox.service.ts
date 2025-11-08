import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxMessage } from './entities/outbox-message.entity';
import { RabbitMQService } from '@common/rabbitmq/rabbitmq.service';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(
    @InjectRepository(OutboxMessage)
    private outboxRepo: Repository<OutboxMessage>,
    private rabbitMQService: RabbitMQService,
  ) {}

  async create(data: {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    payload: any;
  }): Promise<OutboxMessage> {
    const message = this.outboxRepo.create(data);
    return this.outboxRepo.save(message);
  }

  // Process outbox messages every 5 seconds
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processOutbox() {
    const messages = await this.outboxRepo.find({
      where: { 
        processed: false,
        retryCount: LessThan(5), // Max 5 retries
      },
      take: 100,
      order: { createdAt: 'ASC' },
    });

    if (messages.length === 0) return;

    this.logger.log(`Processing ${messages.length} outbox messages`);

    for (const message of messages) {
      try {
        // Publish to RabbitMQ
        const published = await this.rabbitMQService.publish(
          message.eventType,
          message.payload,
        );

        if (published) {
          message.processed = true;
          message.processedAt = new Date();
          await this.outboxRepo.save(message);
          
          this.logger.log(`✅ Processed outbox message ${message.id}`);
        } else {
          throw new Error('Failed to publish to RabbitMQ');
        }
      } catch (error) {
        message.retryCount++;
        message.error = error.message;
        await this.outboxRepo.save(message);
        
        this.logger.error(
          `❌ Failed to process outbox message ${message.id}: ${error.message}`,
        );
      }
    }
  }

    // Clean up old processed messages (keep for 30 days)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupOldMessages() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.outboxRepo.delete({
      processed: true,
      processedAt: LessThan(thirtyDaysAgo),
    });

    this.logger.log(`Cleaned up ${result.affected} old outbox messages`);
  }
}
