import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { InboxService } from '@modules/inbox/inbox.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class RabbitMQConsumer {
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(
    private rabbitMQService: RabbitMQService,
    private inboxService: InboxService,
    private eventEmitter: EventEmitter2,
  ) {}

  async startConsumers() {
    // Consume notifications queue
    await this.rabbitMQService.consume(
      'taskflow.notifications',
      async (message) => {
        await this.handleNotificationMessage(message);
      },
    );

    // Consume webhooks queue
    await this.rabbitMQService.consume(
      'taskflow.webhooks',
      async (message) => {
        await this.handleWebhookMessage(message);
      },
    );

    this.logger.log('✅ RabbitMQ consumers started');
  }

  private async handleNotificationMessage(message: any) {
    const messageId = message.id || `${message.eventType}-${Date.now()}`;

    await this.inboxService.processMessage(
      messageId,
      message.eventType,
      message.payload,
      'rabbitmq',
      async () => {
        // Emit internal event for notification handlers
        this.eventEmitter.emit(message.eventType, message.payload);
      },
    );
  }

  private async handleWebhookMessage(message: any) {
    const messageId = message.id || `${message.eventType}-${Date.now()}`;

    await this.inboxService.processMessage(
      messageId,
      message.eventType,
      message.payload,
      'rabbitmq',
      async () => {
        // Trigger webhook delivery
        this.eventEmitter.emit('webhook.trigger', {
          eventType: message.eventType,
          payload: message.payload,
        });
      },
    );
  }
}