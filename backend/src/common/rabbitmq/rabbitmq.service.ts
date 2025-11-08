import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection!: amqp.ChannelModel;
  private channel!: amqp.Channel;
  private readonly logger = new Logger(RabbitMQService.name);

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const url = this.configService.get<string>('RABBITMQ_URL')!;
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      
      // Declare exchanges
      await this.channel.assertExchange('taskflow.events', 'topic', {
        durable: true,
      });
      
      // Declare queues
      await this.channel.assertQueue('taskflow.notifications', {
        durable: true,
      });
      
      await this.channel.assertQueue('taskflow.webhooks', {
        durable: true,
      });
      
      // Bind queues to exchange
      await this.channel.bindQueue(
        'taskflow.notifications',
        'taskflow.events',
        'task.*',
      );
      
      await this.channel.bindQueue(
        'taskflow.webhooks',
        'taskflow.events',
        '*.*',
      );

      this.logger.log('✅ Connected to RabbitMQ');
    } catch (error) {
      this.logger.error('❌ Failed to connect to RabbitMQ', error.stack);
      throw error;
    }
  }

  private async disconnect() {
    try {
      await this.channel?.close();
      await this.connection?.close();
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error('Error disconnecting from RabbitMQ', error.stack);
    }
  }

  async publish(routingKey: string, message: any): Promise<boolean> {
    try {
      const buffer = Buffer.from(JSON.stringify(message));
      return this.channel.publish(
        'taskflow.events',
        routingKey,
        buffer,
        {
          persistent: true,
          timestamp: Date.now(),
        },
      );
    } catch (error) {
      this.logger.error(`Failed to publish message: ${error.message}`, error.stack);
      return false;
    }
  }

  async consume(
    queue: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    await this.channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Error processing message: ${error.message}`, error.stack);
          this.channel.nack(msg, false, false); // Don't requeue failed messages
        }
      }
    });
  }
}
export { RabbitMQService as RabbitmqService };