import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DeadLetter } from './entities/dead-letter.entity';
import { InboxService } from '@modules/inbox/inbox.service';

@Injectable()
export class DLQService {
  private readonly logger = new Logger(DLQService.name);
  private readonly MAX_RETRIES = 5;

  constructor(
    @InjectRepository(DeadLetter)
    private dlqRepo: Repository<DeadLetter>,
    private inboxService: InboxService,
  ) {}

  async addToDeadLetter(
    messageId: string,
    eventType: string,
    payload: any,
    source: string,
    failureReason: string,
    attemptCount: number,
  ): Promise<DeadLetter> {
    const deadLetter = this.dlqRepo.create({
      originalMessageId: messageId,
      eventType,
      payload,
      source,
      failureReason,
      attemptCount,
      firstFailedAt: new Date(),
      lastFailedAt: new Date(),
      resolved: false,
    });

    await this.dlqRepo.save(deadLetter);

    this.logger.error(
      `📮 Message ${messageId} moved to Dead Letter Queue after ${attemptCount} attempts`,
    );

    return deadLetter;
  }

  async findUnresolved(limit: number = 50): Promise<DeadLetter[]> {
    return this.dlqRepo.find({
      where: { resolved: false },
      order: { lastFailedAt: 'DESC' },
      take: limit,
    });
  }

  async findByEventType(eventType: string): Promise<DeadLetter[]> {
    return this.dlqRepo.find({
      where: { eventType, resolved: false },
      order: { lastFailedAt: 'DESC' },
    });
  }
  
  async retryMessage(
    id: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const deadLetter = await this.dlqRepo.findOne({ where: { id } });

    if (!deadLetter) {
      throw new Error('Dead letter not found');
    }

    try {
      // Try to reprocess through inbox
      await this.inboxService.retryMessage(deadLetter.originalMessageId);

      // Mark as resolved
      deadLetter.resolved = true;
      deadLetter.resolvedAt = new Date();
      deadLetter.resolvedBy = userId;
      deadLetter.resolutionNotes = 'Successfully retried';
      await this.dlqRepo.save(deadLetter);

      this.logger.log(`✅ Dead letter ${id} successfully retried`);
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to retry dead letter ${id}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async markAsResolved(
    id: string,
    userId: string,
    notes: string,
  ): Promise<void> {
    const deadLetter = await this.dlqRepo.findOne({ where: { id } });

    if (!deadLetter) {
      throw new Error('Dead letter not found');
    }

    deadLetter.resolved = true;
    deadLetter.resolvedAt = new Date();
    deadLetter.resolvedBy = userId;
    deadLetter.resolutionNotes = notes;

    await this.dlqRepo.save(deadLetter);
  }

  async getStats(): Promise<any> {
    const [total, resolved] = await Promise.all([
      this.dlqRepo.count(),
      this.dlqRepo.count({ where: { resolved: true } }),
    ]);

    const byEventType = await this.dlqRepo
      .createQueryBuilder('dlq')
      .select('dlq.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .where('dlq.resolved = false')
      .groupBy('dlq.eventType')
      .getRawMany();

    return {
      total,
      resolved,
      unresolved: total - resolved,
      byEventType,
    };
  }

  // Check stuck messages in inbox and move to DLQ
  @Cron(CronExpression.EVERY_HOUR)
  async checkStuckMessages() {
    const stuckMessages = await this.inboxService.getStuckMessages(
      this.MAX_RETRIES,
    );

    for (const message of stuckMessages) {
      if (message.retryCount >= this.MAX_RETRIES) {
        await this.addToDeadLetter(
          message.messageId,
          message.eventType,
          message.payload,
          message.source,
          message.error || 'Max retries exceeded',
          message.retryCount,
        );
      }
    }
  }
}