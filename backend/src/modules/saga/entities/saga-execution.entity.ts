import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '@common/entities/base.entity';

@Entity('saga_executions')
export class SagaExecutionEntity extends BaseEntity {
  @Column({ type: 'varchar' })
  @Index()
  sagaName: string;

  @Column({ type: 'varchar' })
  @Index()
  status: string;

  @Column({ type: 'int', default: 0 })
  currentStep: number;

  @Column({ type: 'simple-array' })
  completedSteps: string[];

  @Column({ type: 'varchar', nullable: true })
  failedStep?: string;

  @Column({ type: 'text', nullable: true })
  error?: string;

  @Column({ type: 'timestamp' })
  startedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @Column({ type: 'jsonb' })
  context: Record<string, string>;
}