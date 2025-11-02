import { Entity, Column, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { User } from '@modules/users/entities/user.entity';
import { Project } from '@modules/projects/entities/project.entity';
import { SubscriptionPlan } from '@common/enums/subscription-plan.enum';
import { SubscriptionStatus } from '@common/enums/subscription-status.enum';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @ApiProperty({ description: 'Organization name' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiProperty({ description: 'Unique subdomain' })
  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  subdomain: string;

  @ApiProperty({ description: 'Tenant settings', required: false })
  @Column({ type: 'jsonb', nullable: true, default: {} })
  settings: Record<string, any>;

  @ApiProperty({ description: 'Subscription plan' })
  @Column({
    type: 'enum',
    enum: SubscriptionPlan,
    default: SubscriptionPlan.FREE,
  })
  subscriptionPlan: SubscriptionPlan;

  @ApiProperty({ description: 'Subscription status' })
  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.TRIAL,
  })
  subscriptionStatus: SubscriptionStatus;

  @ApiProperty({ description: 'Trial end date', required: false })
  @Column({ type: 'timestamp', nullable: true })
  trialEndsAt?: Date;

  @ApiProperty({ description: 'Is tenant active' })
  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  // Relations
  @OneToMany(() => User, (user) => user.tenant)
  users: User[];

  @OneToMany(() => Project, (project) => project.tenant)
  projects: Project[];
}