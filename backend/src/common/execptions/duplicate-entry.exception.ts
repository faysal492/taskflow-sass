import { ConflictException } from '@nestjs/common';

export class DuplicateEntryException extends ConflictException {
  constructor(field: string, value: string) {
    super(`${field} '${value}' already exists`);
  }
}
