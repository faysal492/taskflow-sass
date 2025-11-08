import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventStore } from './entities/event-store.entity';

@Injectable()
export class EventStoreService {
  private readonly logger = new Logger(EventStoreService.name);

  constructor(
    @InjectRepository(EventStore)
    private eventStoreRepo: Repository<EventStore>,
    private eventEmitter: EventEmitter2,
  ) {}

  /**
   * Store an event
   */
  async appendEvent(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: any,
    metadata?: any,
  ): Promise<EventStore> {
    // Get next version for this aggregate
    const lastEvent = await this.eventStoreRepo.findOne({
      where: { aggregateId, aggregateType },
      order: { version: 'DESC' },
    });

    const version = (lastEvent?.version || 0) + 1;

    const event = this.eventStoreRepo.create({
      aggregateId,
      aggregateType,
      eventType,
      version,
      eventData,
      metadata,
      occurredAt: new Date(),
    });

    return this.eventStoreRepo.save(event);
  }

  /**
   * Get all events for an aggregate
   */
  async getAggregateEvents(
    aggregateId: string,
    aggregateType: string,
  ): Promise<EventStore[]> {
    return this.eventStoreRepo.find({
      where: { aggregateId, aggregateType },
      order: { version: 'ASC' },
    });
  }

  /**
   * Get events in a time range
   */
  async getEventsByTimeRange(
    startDate: Date,
    endDate: Date,
    eventType?: string,
  ): Promise<EventStore[]> {
    const query: any = {
      occurredAt: Between(startDate, endDate),
    };

    if (eventType) {
      query.eventType = eventType;
    }

    return this.eventStoreRepo.find({
      where: query,
      order: { occurredAt: 'ASC' },
    });
  }

  /**
   * Replay events
   */
  async replayEvents(
    startDate: Date,
    endDate: Date,
    eventTypes?: string[],
    dryRun: boolean = false,
  ): Promise<{ processed: number; errors: number }> {
    const query: any = {
      occurredAt: Between(startDate, endDate),
    };

    if (eventTypes && eventTypes.length > 0) {
      // Get events of specified types
      const events = await this.eventStoreRepo
        .createQueryBuilder('event')
        .where('event.occurredAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate,
        })
        .andWhere('event.eventType IN (:...eventTypes)', { eventTypes })
        .orderBy('event.occurredAt', 'ASC')
        .getMany();

      return this.processReplay(events, dryRun);
    }

    const events = await this.eventStoreRepo.find({
      where: query,
      order: { occurredAt: 'ASC' },
    });

    return this.processReplay(events, dryRun);
  }

  private async processReplay(
    events: EventStore[],
    dryRun: boolean,
  ): Promise<{ processed: number; errors: number }> {
    let processed = 0;
    let errors = 0;

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Replaying ${events.length} events...`,
    );

    for (const event of events) {
      try {
        if (!dryRun) {
          // Re-emit the event
          this.eventEmitter.emit(event.eventType, {
            ...event.eventData,
            __isReplay: true,
            __originalEventId: event.id,
            __replayedAt: new Date(),
          });
        }

        processed++;

        if (processed % 100 === 0) {
          this.logger.log(`Replayed ${processed}/${events.length} events`);
        }
      } catch (error) {
        errors++;
        this.logger.error(
          `Failed to replay event ${event.id}: ${error.message}`,
        );
      }
    }

    this.logger.log(
      `${dryRun ? '[DRY RUN] ' : ''}Replay complete: ${processed} processed, ${errors} errors`,
    );

    return { processed, errors };
  }

  /**
   * Rebuild aggregate from events (Event Sourcing)
   */
  async rebuildAggregate(
    aggregateId: string,
    aggregateType: string,
  ): Promise<EventStore> {
    const events = await this.getAggregateEvents(aggregateId, aggregateType);

    // Reconstruct state from events
    let state: any = {};

    for (const event of events) {
      state = this.applyEvent(state, event);
    }

    return state;
  }

  private applyEvent(state: any, event: EventStore): any {
    // Apply event to state based on event type
    switch (event.eventType) {
      case 'TaskCreated':
        return {
          ...event.eventData,
          version: event.version,
        };

      case 'TaskUpdated':
        return {
          ...state,
          ...event.eventData,
          version: event.version,
        };

      case 'TaskStatusChanged':
        return {
          ...state,
          status: event.eventData.newStatus,
          version: event.version,
        };

      default:
        return state;
    }
  }

  /**
   * Get event statistics
   */
  async getStats(days: number = 7): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await this.eventStoreRepo
      .createQueryBuilder('event')
      .select('event.eventType', 'eventType')
      .addSelect('COUNT(*)', 'count')
      .addSelect('DATE(event.occurredAt)', 'date')
      .where('event.occurredAt >= :startDate', { startDate })
      .groupBy('event.eventType')
      .addGroupBy('DATE(event.occurredAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return stats;
  }
}