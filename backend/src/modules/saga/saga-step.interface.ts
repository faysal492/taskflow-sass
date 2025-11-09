export type SagaStepResult = Record<string, any>;

export interface SagaStep {
  name: string;
  execute: () => Promise<SagaStepResult>;
  compensate: () => Promise<void>;
}

export interface SagaDefinition {
  name: string;
  steps: SagaStep[];
}

export interface SagaExecution {
  id: string;
  sagaName: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'COMPENSATING' | 'COMPENSATED';
  currentStep: number;
  completedSteps: string[];
  failedStep?: string;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  context: Record<string, string>;
}