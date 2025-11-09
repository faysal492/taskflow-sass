import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SagaService } from './saga.service';
import { SagaExecutionEntity } from './entities/saga-execution.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SagaExecutionEntity])],
  providers: [SagaService],
  exports: [SagaService],
})
export class SagaModule {}
