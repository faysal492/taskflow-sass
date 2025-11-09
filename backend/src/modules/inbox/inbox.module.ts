import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { InboxService } from './inbox.service';
import { InboxMessageRepository } from './inbox-message.repository';
import { InboxMessage } from './entities/inbox-message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([InboxMessage]),
    // If EventEmitterModule.forRoot() is already imported in AppModule, you can remove the next line
    EventEmitterModule.forRoot(),
  ],
  providers: [InboxService, InboxMessageRepository],
  exports: [InboxService, InboxMessageRepository],
})
export class InboxModule {}
