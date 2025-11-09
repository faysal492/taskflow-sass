import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboxModule } from '@modules/inbox/inbox.module';
import { DLQService } from './dlq.service';
import { DLQController } from './dlq.controller';
import { DeadLetter } from './entities/dead-letter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeadLetter]),
    InboxModule,
  ],
  providers: [DLQService],
  controllers: [DLQController],
  exports: [DLQService],
})
export class DlqModule {}
