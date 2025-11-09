import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { EventStoreService } from './event-store.service';
import { EventStore } from './entities/event-store.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventStore]),
    // If EventEmitterModule.forRoot() is already added globally, you can remove this next line
    EventEmitterModule.forRoot(),
  ],
  providers: [EventStoreService],
  exports: [EventStoreService],
})
export class EventStoreModule {}
