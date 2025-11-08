import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('outbox_messages')
export class OutboxMessage extends BaseEntity {
  @Column({ type: 'varchar' })
  @Index()
  aggregateId: string;

  @Column({ type: 'varchar' })
  aggregateType: string;

  @Column({ type: 'varchar' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'boolean', default: false })
  @Index()
  processed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'text', nullable: true })
  error?: string;
}