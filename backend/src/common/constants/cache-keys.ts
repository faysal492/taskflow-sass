export const CACHE_KEYS = {
  USER_BY_ID: (id: string) => `user:${id}`,
  USER_BY_EMAIL: (email: string) => `user:email:${email}`,
  TENANT_BY_ID: (id: string) => `tenant:${id}`,
  TENANT_SETTINGS: (tenantId: string) => `tenant:${tenantId}:settings`,
  DASHBOARD_STATS: (tenantId: string) => `dashboard:${tenantId}`,
  TASK_LIST: (tenantId: string, status?: string) => 
    `tasks:${tenantId}${status ? `:${status}` : ''}`,
};