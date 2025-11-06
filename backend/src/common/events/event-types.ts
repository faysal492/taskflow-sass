export enum EventType {
  // Task events
  TASK_CREATED = 'task.created',
  TASK_UPDATED = 'task.updated',
  TASK_STATUS_CHANGED = 'task.status.changed',
  TASK_ASSIGNED = 'task.assigned',
  TASK_DELETED = 'task.deleted',
  TASK_OVERDUE = 'task.overdue',
  
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_LOGGED_IN = 'user.logged_in',
  
  // Project events
  PROJECT_CREATED = 'project.created',
  PROJECT_MEMBER_ADDED = 'project.member.added',
  
  // System events
  NOTIFICATION_SEND = 'notification.send',
  EMAIL_SEND = 'email.send',
  WEBHOOK_TRIGGER = 'webhook.trigger',
}
