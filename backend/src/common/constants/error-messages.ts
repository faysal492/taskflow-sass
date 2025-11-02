export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Token has expired',
  TOKEN_INVALID: 'Invalid token',
  UNAUTHORIZED: 'Unauthorized access',
  
  // User errors
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_INACTIVE: 'User account is inactive',
  
  // Tenant errors
  TENANT_NOT_FOUND: 'Tenant not found',
  TENANT_ALREADY_EXISTS: 'Tenant with this subdomain already exists',
  TENANT_SUSPENDED: 'Tenant account is suspended',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'Resource not found',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists',
  
  // Permission errors
  INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
  ACCESS_DENIED: 'Access denied',
  
  // Validation errors
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input provided',
  
  // Generic errors
  INTERNAL_SERVER_ERROR: 'An internal server error occurred',
  BAD_REQUEST: 'Bad request',
};