import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SagaExecutionEntity } from './entities/saga-execution.entity';
import { SagaDefinition, SagaStep, SagaExecution } from './saga-step.interface';

@Injectable()
export class SagaService {
  private readonly logger = new Logger(SagaService.name);
  private sagas = new Map();

  constructor(
    @InjectRepository(SagaExecutionEntity)
    private sagaRepo: Repository<SagaExecutionEntity>,
  ) {}

  /**
   * Register a saga definition
   */
  registerSaga(saga: SagaDefinition) {
    this.sagas.set(saga.name, saga);
    this.logger.log(`Registered saga: ${saga.name}`);
  }

  /**
   * Execute a saga
   */
  async executeSaga(
    sagaName: string,
    initialContext: Record<string, string> = {},
  ): Promise<SagaExecutionEntity> {
    const saga = this.sagas.get(sagaName);
    if (!saga) {
      throw new Error(`Saga ${sagaName} not found`);
    }

    // Create execution record
    const execution = await this.sagaRepo.save({
      sagaName,
      status: 'RUNNING',
      currentStep: 0,
      completedSteps: [],
      startedAt: new Date(),
      context: initialContext,
    });

    this.logger.log(`Starting saga execution: ${execution.id}`);

    try {
      // Execute steps sequentially
      for (let i = 0; i < saga.steps.length; i++) {
        const step = saga.steps[i];
        
        this.logger.log(`Executing step ${i + 1}/${saga.steps.length}: ${step.name}`);

        execution.currentStep = i;
        await this.sagaRepo.save(execution);

        try {
          // Execute step
          const result = await step.execute();
          
          // Store result in context
          execution.context[step.name] = result;
          execution.completedSteps.push(step.name);
          await this.sagaRepo.save(execution);

          this.logger.log(`✅ Step completed: ${step.name}`);
        } catch (error) {
          this.logger.error(`❌ Step failed: ${step.name} - ${error.message}`);
          
          // Step failed, start compensation
          execution.status = 'COMPENSATING';
          execution.failedStep = step.name;
          execution.error = error.message;
          await this.sagaRepo.save(execution);

          await this.compensate(saga, execution, i - 1);
          
          execution.status = 'COMPENSATED';
          execution.completedAt = new Date();
          await this.sagaRepo.save(execution);

          throw error;
        }
      }

      // All steps completed successfully
      execution.status = 'COMPLETED';
      execution.completedAt = new Date();
      await this.sagaRepo.save(execution);

      this.logger.log(`✅ Saga completed successfully: ${execution.id}`);
      return execution;
    } catch (error) {
      this.logger.error(`❌ Saga failed: ${execution.id} - ${error.message}`);
      throw error;
    }
  }

  /**
   * Compensate completed steps in reverse order
   */
  private async compensate(
    saga: SagaDefinition,
    execution: SagaExecutionEntity,
    lastCompletedStepIndex: number,
  ) {
    this.logger.log(`Starting compensation from step ${lastCompletedStepIndex}`);

    // Compensate in reverse order
    for (let i = lastCompletedStepIndex; i >= 0; i--) {
      const step = saga.steps[i];
      
      try {
        this.logger.log(`Compensating step: ${step.name}`);
        await step.compensate();
        this.logger.log(`✅ Compensation completed: ${step.name}`);
      } catch (error) {
        this.logger.error(
          `❌ Compensation failed for ${step.name}: ${error.message}`,
        );
        // Continue with other compensations even if one fails
      }
    }
  }

  /**
   * Get saga execution history
   */
  async getExecutionHistory(sagaName?: string): Promise<SagaExecutionEntity[]> {
    const query: any = {};
    if (sagaName) {
      query.sagaName = sagaName;
    }

    return this.sagaRepo.find({
      where: query,
      order: { startedAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * Get saga statistics
   */
  async getStats(): Promise<SagaExecutionEntity[]> {
    const stats = await this.sagaRepo
      .createQueryBuilder('saga')
      .select('saga.sagaName', 'sagaName')
      .addSelect('saga.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('saga.sagaName')
      .addGroupBy('saga.status')
      .getRawMany();

    return stats;
  }
}