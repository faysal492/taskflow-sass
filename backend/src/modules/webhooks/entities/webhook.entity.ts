import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('webhooks')
export class Webhook extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'simple-array' })
  events: string[]; // ['task.created', 'task.updated']

  @Column({ type: 'varchar', nullable: true })
  secret?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  headers?: Record<string, string>;

  @Column({ type: 'int', default: 0 })
  failureCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastTriggeredAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastSuccessAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastFailureAt?: Date;
}