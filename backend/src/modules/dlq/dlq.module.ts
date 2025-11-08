import { Module } from '@nestjs/common';
import { DLQService } from './dlq.service';
import { DLQController } from './dlq.controller';

@Module({
  providers: [DLQService],
  controllers: [DLQController]
})
export class DlqModule {}
