import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { InboxMessage } from './entities/inbox-message.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @InjectRepository(InboxMessage)
    private inboxRepo: Repository<InboxMessage>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Process message with idempotency guarantee
   */
  async processMessage(
    messageId: string,
    eventType: string,
    payload: any,
    source: string,
    handler: () => Promise<void>,
  ): Promise<boolean> {
    // Check if message already processed
    const existing = await this.inboxRepo.findOne({
      where: { messageId },
    });

    if (existing?.processed) {
      this.logger.log(`Message ${messageId} already processed, skipping`);
      return false; // Already processed
    }

    // Create inbox record if doesn't exist
    let inboxMessage = existing;
    if (!inboxMessage) {
      inboxMessage = await this.inboxRepo.save({
        messageId,
        eventType,
        payload,
        source,
        processed: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      });
    }

    // Process message
    try {
      await handler();

      // Mark as processed
      inboxMessage.processed = true;
      inboxMessage.processedAt = new Date();
      await this.inboxRepo.save(inboxMessage);

      this.logger.log(`✅ Message ${messageId} processed successfully`);
      return true;
    } catch (error) {
      inboxMessage.retryCount++;
      inboxMessage.error = error.message;
      await this.inboxRepo.save(inboxMessage);

      this.logger.error(
        `❌ Failed to process message ${messageId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Clean up old processed messages
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.inboxRepo.delete({
      processed: true,
      expiresAt: LessThan(new Date()),
    });

    this.logger.log(`Cleaned up ${result.affected} expired inbox messages`);
    return result.affected || 0;
  }

  /**
   * Get stuck messages (not processed after multiple retries)
   */
  async getStuckMessages(maxRetries: number = 5): Promise<InboxMessage[]> {
    return this.inboxRepo.find({
      where: {
        processed: false,
      },
      order: { createdAt: 'ASC' },
      take: 100,
    });
  }

  /**
   * Manually retry a message
   */
  async retryMessage(messageId: string): Promise<void> {
    const message = await this.inboxRepo.findOne({ where: { messageId } });
    
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.processed) {
      throw new Error('Message already processed');
    }

    // Emit event to retry
    this.eventEmitter.emit(message.eventType, message.payload);
  }
}