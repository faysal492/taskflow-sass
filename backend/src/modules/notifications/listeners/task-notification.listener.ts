import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';
import { EventType } from '@common/events/event-types';
import {
  TaskAssignedEvent,
  TaskStatusChangedEvent,
} from '@common/events/event-payloads.interface';

@Injectable()
export class TaskNotificationListener {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  @OnEvent(EventType.TASK_ASSIGNED)
  async handleTaskAssigned(event: TaskAssignedEvent) {
    // Send email to assignee
    await this.notificationsService.sendTaskAssignedEmail({
      assigneeEmail: event.assignee.email,
      assigneeName: event.assignee.fullName,
      assignedByName: event.assignedBy.fullName,
      taskId: event.task.id,
      taskTitle: event.task.title,
      priority: event.task.priority,
      status: event.task.status,
      description: event.task.description,
      dueDate: event.task.dueDate,
      tenantName: event.assignee.tenant.name,
    });
  }

  @OnEvent(EventType.TASK_STATUS_CHANGED)
  async handleStatusChanged(event: TaskStatusChangedEvent) {
    // Notify task creator if completed
    if (event.newStatus === 'COMPLETED' && event.task.creator) {
      await this.notificationsService.sendTaskStatusChangedEmail({
        userEmail: event.task.creator.email,
        userName: event.task.creator.fullName,
        taskId: event.task.id,
        taskTitle: event.task.title,
        oldStatus: event.oldStatus,
        newStatus: event.newStatus,
        updatedByName: event.task.creator.fullName,
      });
    }
  }
}