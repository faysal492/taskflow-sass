import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    tenantId: string;
    role: string;
  };
}