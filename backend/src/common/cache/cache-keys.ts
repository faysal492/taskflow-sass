export class CacheKeys {
  // User cache keys
  static user(userId: string): string {
    return `user:${userId}`;
  }

  static userByEmail(email: string): string {
    return `user:email:${email}`;
  }

  static userPattern(tenantId: string): string {
    return `user:*:${tenantId}`;
  }

  // Tenant cache keys
  static tenant(tenantId: string): string {
    return `tenant:${tenantId}`;
  }

  static tenantSettings(tenantId: string): string {
    return `tenant:${tenantId}:settings`;
  }

  // Task cache keys
  static task(taskId: string): string {
    return `task:${taskId}`;
  }

  static taskList(tenantId: string, filters?: string): string {
    const filterKey = filters ? `:${filters}` : '';
    return `tasks:${tenantId}${filterKey}`;
  }

  static tasksByProject(projectId: string): string {
    return `tasks:project:${projectId}`;
  }

  static tasksByAssignee(userId: string): string {
    return `tasks:assignee:${userId}`;
  }

  static taskStats(tenantId: string): string {
    return `tasks:stats:${tenantId}`;
  }

  // Project cache keys
  static project(projectId: string): string {
    return `project:${projectId}`;
  }

  static projectList(tenantId: string): string {
    return `projects:${tenantId}`;
  }

  // Dashboard cache keys
  static dashboard(tenantId: string, userId?: string): string {
    const userKey = userId ? `:${userId}` : '';
    return `dashboard:${tenantId}${userKey}`;
  }

  static dashboardStats(tenantId: string): string {
    return `dashboard:stats:${tenantId}`;
  }

  // Analytics cache keys
  static analytics(tenantId: string, period: string): string {
    return `analytics:${tenantId}:${period}`;
  }

  // Rate limiting keys
  static rateLimit(identifier: string): string {
    return `ratelimit:${identifier}`;
  }
}

export class CacheTTL {
  static readonly SHORT = 60; // 1 minute
  static readonly MEDIUM = 300; // 5 minutes
  static readonly LONG = 3600; // 1 hour
  static readonly VERY_LONG = 86400; // 24 hours
  static readonly INFINITE = 0; // No expiration
}