import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseEntity } from '@common/entities/base.entity';
import { Tenant } from '@modules/tenants/entities/tenant.entity';
import { Task } from '@modules/tasks/entities/task.entity';
import { UserRole } from '@common/enums/user-role.enum';
import { HashUtil } from '@common/utils/hash.util';

@Entity('users')
@Index(['email', 'tenantId'], { unique: true })
export class User extends BaseEntity {
  @ApiProperty({ description: 'User email address' })
  @Column({ type: 'varchar', length: 100 })
  @Index()
  email: string;

  @Exclude() // Don't expose password in responses
  @Column({ type: 'varchar', length: 255 })
  password: string;

  @ApiProperty({ description: 'First name' })
  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @ApiPropertyOptional({ description: 'Profile avatar URL' })
  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.MEMBER,
  })
  role: UserRole;

  @ApiProperty({ description: 'Is user active' })
  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Email verified at' })
  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @ApiPropertyOptional({ description: 'Last login timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  // Tenant relationship
  @ApiProperty({ description: 'Tenant ID' })
  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  // Task relationships
  @OneToMany(() => Task, (task) => task.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Task, (task) => task.creator)
  createdTasks: Task[];

  // Virtual property
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Hash password before saving
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2')) {
      this.password = await HashUtil.hash(this.password);
    }
  }

  // Helper method to compare passwords
  async comparePassword(plainPassword: string): Promise<boolean> {
    return HashUtil.compare(plainPassword, this.password);
  }
}