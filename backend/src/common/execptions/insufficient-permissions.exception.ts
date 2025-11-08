import { ForbiddenException } from '@nestjs/common';

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(action: string) {
    super(`Insufficient permissions to ${action}`);
  }
}