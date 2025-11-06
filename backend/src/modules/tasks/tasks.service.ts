import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { EventType } from '@common/events/event-types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TasksRepository } from './tasks.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTaskDto } from './dto/filter-task.dto';
import { Task } from './entities/task.entity';
import { PaginatedResponseDto } from '@common/dto/pagination.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '@modules/projects/entities/project.entity';
import { User } from '@modules/users/entities/user.entity';
import {
  TaskCreatedEvent,
  TaskStatusChangedEvent,
  TaskAssignedEvent,
} from '@common/events/event-payloads.interface';

@Injectable()
export class TasksService {
  constructor(
    private readonly tasksRepository: TasksRepository,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    createTaskDto: CreateTaskDto,
  ): Promise<Task> {
    const { projectId, assigneeId, ...taskData } = createTaskDto;

    // Validate project belongs to tenant
    const project = await this.projectRepository.findOne({
      where: { id: projectId, tenantId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await this.userRepository.findOne({
        where: { id: assigneeId, tenantId, isActive: true },
      });

      if (!assignee) {
        throw new BadRequestException('Assignee not found or inactive');
      }
    }

    // Create task
    const task = await this.tasksRepository.create({
      ...(taskData as Partial<Task>),
      projectId,
      assigneeId,
      creatorId: userId,
      tenantId,
    });

    // Emit event for notifications
    const event: TaskCreatedEvent = {
      task,
      tenantId,
      userId,
      timestamp: new Date(),
    };

    this.eventEmitter.emit('TASK_CREATED', event);


    if (task.assigneeId && task.assigneeId !== userId) {
      const assignedEvent: TaskAssignedEvent = {
        task,
        assignee: task.assignee!,
        assignedBy: task.creator,
        tenantId,
        timestamp: new Date(),
      };
      this.eventEmitter.emit(EventType.TASK_ASSIGNED, assignedEvent);
    }

    return task;
  }

  async findAll(
    tenantId: string,
    filters: FilterTaskDto,
  ): Promise<PaginatedResponseDto<Task>> {
    const [tasks, total] = await this.tasksRepository.findAllWithFilters(
      tenantId,
      filters,
    );

    return new PaginatedResponseDto(
      tasks,
      total,
      filters.page || 1,
      filters.limit || 10,
    );
  }

  async findOne(id: string, tenantId: string): Promise<Task> {
    const task = await this.tasksRepository.findById(id, tenantId);

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(
    id: string,
    tenantId: string,
    userId: string,
    updateTaskDto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOne(id, tenantId);
    const oldStatus = task.status;
    const oldAssigneeId = task.assigneeId;

    // Update task
    const updatedTask = await this.tasksRepository.update(
      id,
      tenantId,
      updateTaskDto,
    );

    // Status changed event
    if (oldStatus !== updatedTask.status) {
      const statusEvent: TaskStatusChangedEvent = {
        task: updatedTask,
        oldStatus,
        newStatus: updatedTask.status,
        tenantId,
        userId,
        timestamp: new Date(),
      };
      this.eventEmitter.emit(EventType.TASK_STATUS_CHANGED, statusEvent);
    }

    // Assignee changed event
    if (oldAssigneeId !== updatedTask.assigneeId && updatedTask.assignee) {
      const assignedEvent: TaskAssignedEvent = {
        task: updatedTask,
        assignee: updatedTask.assignee,
        assignedBy: updatedTask.creator,
        tenantId,
        timestamp: new Date(),
      };
      this.eventEmitter.emit(EventType.TASK_ASSIGNED, assignedEvent);
    }

    // Generic update event
    this.eventEmitter.emit(EventType.TASK_UPDATED, {
      task: updatedTask,
      tenantId,
      userId,
      timestamp: new Date(),
    });

    return updatedTask;
  }

  async remove(id: string, tenantId: string, userId: string): Promise<void>  {
    const task = await this.findOne(id, tenantId);

    const deleted = await this.tasksRepository.delete(id, tenantId);

    if (!deleted) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    // Emit event
    this.eventEmitter.emit('task.deleted', {
      taskId: id,
      task,
      tenantId,
      userId,
    });
  }

  async getStatsByStatus(tenantId: string, projectId?: string) {
    return this.tasksRepository.getStatsByStatus(tenantId, projectId);
  }

  async getOverdueTasks(tenantId: string): Promise<Task[]> {
    return this.tasksRepository.getOverdueTasks(tenantId);
  }

  async updateStatus(
    id: string,
    tenantId: string,
    userId: string,
    status: string,
  ): Promise<Task> {
    return this.update(id, tenantId, userId, { status } as any);
  }
}