import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('webhook_deliveries')
export class WebhookDelivery extends BaseEntity {
  @Column({ type: 'uuid' })
  @Index()
  webhookId: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ type: 'varchar' })
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: any;

  @Column({ type: 'varchar' })
  url: string;

  @Column({ type: 'int', nullable: true })
  statusCode?: number;

  @Column({ type: 'text', nullable: true })
  response?: string;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ type: 'boolean', default: false })
  success: boolean;

  @Column({ type: 'int', nullable: true })
  durationMs?: number;

  @Column({ type: 'int', default: 0 })
  retryCount: number;
}