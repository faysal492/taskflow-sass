import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Tenant } from '@modules/tenants/entities/tenant.entity';
import { User } from '@modules/users/entities/user.entity';
import { Project } from '@modules/projects/entities/project.entity';
import { TaskStatus } from '@common/enums/task-status.enum';
import { Priority } from '@common/enums/priority.enum';

@Entity('tasks')
@Index(['tenantId', 'status', 'priority'])
@Index(['assigneeId', 'status'])
@Index(['projectId', 'status'])

export class Task extends BaseEntity {
  @ApiProperty({ description: 'Task title' })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiPropertyOptional({ description: 'Task description' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({ description: 'Task status', enum: TaskStatus })
  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  @Index()
  status: TaskStatus;

  @ApiProperty({ description: 'Task priority', enum: Priority })
  @Column({
    type: 'enum',
    enum: Priority,
    default: Priority.MEDIUM,
  })
  priority: Priority;

  @ApiPropertyOptional({ description: 'Due date' })
  @Column({ type: 'timestamp', nullable: true })
  @Index()
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Estimated hours' })
  @Column({ type: 'float', nullable: true })
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'Actual hours' })
  @Column({ type: 'float', nullable: true, default: 0 })
  actualHours?: number;

  @ApiPropertyOptional({ description: 'Task tags' })
  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  // Tenant relationship
  @ApiProperty({ description: 'Tenant ID' })
  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // Project relationship
  @ApiProperty({ description: 'Project ID' })
  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, (project) => project.tasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  // Assignee relationship
  @ApiPropertyOptional({ description: 'Assignee user ID' })
  @Column({ type: 'uuid', nullable: true })
  assigneeId?: string;

  @ManyToOne(() => User, (user) => user.assignedTasks, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'assigneeId' })
  assignee?: User;

  // Creator relationship
  @ApiProperty({ description: 'Creator user ID' })
  @Column({ type: 'uuid' })
  creatorId: string;

  @ManyToOne(() => User, (user) => user.createdTasks, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'creatorId' })
  creator: User;

  // Helper properties
  get isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== TaskStatus.COMPLETED;
  }

  get isCompleted(): boolean {
    return this.status === TaskStatus.COMPLETED;
  }
}