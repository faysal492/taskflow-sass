import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('inbox_messages')
export class InboxMessage extends BaseEntity {
  @Column({ type: 'varchar', unique: true })
  messageId: string; // Unique message identifier

  @Column({ type: 'varchar' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'varchar' })
  source: string; // rabbitmq, webhook, api

  @Column({ type: 'boolean', default: false })
  @Index()
  processed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  processedBy?: string; // Handler name

  @Column({ type: 'int', default: 0 })
  retryCount: number;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date; // For message TTL
}