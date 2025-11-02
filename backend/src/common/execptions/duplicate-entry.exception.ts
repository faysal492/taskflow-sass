import { ConflictException } from '@nestjs/common';

export class DuplicateEntryException extends ConflictException {
  constructor(field: string, value: string) {
    super(`${field} '${value}' already exists`);
  }
}

// src/common/exceptions/insufficient-permissions.exception.ts
import { ForbiddenException } from '@nestjs/common';

export class InsufficientPermissionsException extends ForbiddenException {
  constructor(action: string) {
    super(`Insufficient permissions to ${action}`);
  }
}