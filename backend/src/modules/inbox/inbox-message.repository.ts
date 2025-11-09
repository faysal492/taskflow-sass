import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InboxMessage } from './entities/inbox-message.entity';

@Injectable()
export class InboxMessageRepository {
  constructor(
    @InjectRepository(InboxMessage)
    private readonly repo: Repository<InboxMessage>,
  ) {}

  async saveMessage(message: Partial<InboxMessage>) {
    return this.repo.save(message);
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }
}