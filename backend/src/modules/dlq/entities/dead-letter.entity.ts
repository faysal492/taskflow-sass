import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('dead_letter_queue')
export class DeadLetter extends BaseEntity {
  @Column({ type: 'varchar' })
  @Index()
  originalMessageId: string;

  @Column({ type: 'varchar' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'varchar' })
  source: string;

  @Column({ type: 'text' })
  failureReason: string;

  @Column({ type: 'int' })
  attemptCount: number;

  @Column({ type: 'timestamp' })
  firstFailedAt: Date;

  @Column({ type: 'timestamp' })
  lastFailedAt: Date;

  @Column({ type: 'boolean', default: false })
  @Index()
  resolved: boolean;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  resolvedBy?: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes?: string;
}