import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('event_store')
@Index(['aggregateId', 'version'], { unique: true })
export class EventStore extends BaseEntity {
  @Column({ type: 'varchar' })
  @Index()
  aggregateId: string; // task-123, user-456

  @Column({ type: 'varchar' })
  @Index()
  aggregateType: string; // Task, User, Project

  @Column({ type: 'varchar' })
  @Index()
  eventType: string; // TaskCreated, TaskUpdated

  @Column({ type: 'int' })
  version: number; // Event version for the aggregate

  @Column({ type: 'jsonb' })
  eventData: any;

  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    userId?: string;
    tenantId?: string;
    ipAddress?: string;
    userAgent?: string;
    causationId?: string; // What caused this event
    correlationId?: string; // Group related events
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Index()
  occurredAt: Date;
}