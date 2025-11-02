import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Tenant } from '@modules/tenants/entities/tenant.entity';
import { Task } from '@modules/tasks/entities/task.entity';
import { User } from '@modules/users/entities/user.entity';

@Entity('projects')
@Index(['tenantId', 'isActive'])
export class Project extends BaseEntity {
  @ApiProperty({ description: 'Project name' })
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @ApiPropertyOptional({ description: 'Project description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Project key/code' })
  @Column({ type: 'varchar', length: 10 })
  @Index()
  key: string; // e.g., "TASK", "PROJ"

  @ApiPropertyOptional({ description: 'Project color' })
  @Column({ type: 'varchar', length: 7, default: '#1890ff' })
  color: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @ApiPropertyOptional({ description: 'End date' })
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @ApiProperty({ description: 'Is project active' })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Tenant relationship
  @ApiProperty({ description: 'Tenant ID' })
  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.projects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // Owner relationship
  @ApiProperty({ description: 'Project owner ID' })
  @Column({ type: 'uuid' })
  ownerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  // Tasks relationship
  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];
}