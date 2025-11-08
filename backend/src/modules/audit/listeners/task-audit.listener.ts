import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditService } from '../audit.service';
import { EventType } from '@common/events/event-types';
import {
  TaskCreatedEvent,
  TaskStatusChangedEvent,
  TaskAssignedEvent,
} from '@common/events/event-payloads.interface';

@Injectable()
export class TaskAuditListener {
  constructor(private readonly auditService: AuditService) {}

  @OnEvent(EventType.TASK_CREATED)
  async handleTaskCreated(event: TaskCreatedEvent) {
    await this.auditService.log({
      tenantId: event.tenantId,
      userId: event.userId,
      action: 'TASK_CREATED',
      entityType: 'Task',
      entityId: event.task.id,
      metadata: {
        title: event.task.title,
        status: event.task.status,
        priority: event.task.priority,
        projectId: event.task.projectId,
      },
    });
  }

  @OnEvent(EventType.TASK_STATUS_CHANGED)
  async handleStatusChanged(event: TaskStatusChangedEvent) {
    await this.auditService.log({
      tenantId: event.tenantId,
      userId: event.userId,
      action: 'TASK_STATUS_CHANGED',
      entityType: 'Task',
      entityId: event.task.id,
      metadata: {
        title: event.task.title,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
      },
    });
  }

  @OnEvent(EventType.TASK_ASSIGNED)
  async handleTaskAssigned(event: TaskAssignedEvent) {
    await this.auditService.log({
      tenantId: event.tenantId,
      userId: event.assignedBy.id,
      action: 'TASK_ASSIGNED',
      entityType: 'Task',
      entityId: event.task.id,
      metadata: {
        title: event.task.title,
        assigneeId: event.assignee.id,
        assigneeName: event.assignee.fullName,
        assignedByName: event.assignedBy.fullName,
      },
    });
  }

  @OnEvent(EventType.TASK_UPDATED)
  async handleTaskUpdated(event: any) {
    await this.auditService.log({
      tenantId: event.tenantId,
      userId: event.userId,
      action: 'TASK_UPDATED',
      entityType: 'Task',
      entityId: event.task.id,
      metadata: {
        title: event.task.title,
      },
    });
  }

  @OnEvent(EventType.TASK_DELETED)
  async handleTaskDeleted(event: any) {
    await this.auditService.log({
      tenantId: event.tenantId,
      userId: event.userId,
      action: 'TASK_DELETED',
      entityType: 'Task',
      entityId: event.taskId,
      metadata: {
        title: event.task.title,
      },
    });
  }
}