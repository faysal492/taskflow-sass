import { Task } from '@modules/tasks/entities/task.entity';
import { User } from '@modules/users/entities/user.entity';
import { Project } from '@modules/projects/entities/project.entity';

export interface TaskCreatedEvent {
  task: Task;
  tenantId: string;
  userId: string;
  timestamp: Date;
}

export interface TaskStatusChangedEvent {
  task: Task;
  oldStatus: string;
  newStatus: string;
  tenantId: string;
  userId: string;
  timestamp: Date;
}

export interface TaskAssignedEvent {
  task: Task;
  assignee: User;
  assignedBy: User;
  tenantId: string;
  timestamp: Date;
}

export interface UserLoggedInEvent {
  user: User;
  tenantId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export interface NotificationEvent {
  type: string;
  recipientId: string;
  tenantId: string;
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export interface EmailEvent {
  to: string;
  subject: string;
  template: string;
  context: any;
  tenantId: string;
  timestamp: Date;
}

export interface WebhookEvent {
  tenantId: string;
  eventType: string;
  payload: any;
  url: string;
  timestamp: Date;
}