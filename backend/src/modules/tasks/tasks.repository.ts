import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThan, In } from 'typeorm';
import { Task } from './entities/task.entity';
import { Tenant } from '@modules/tenants/entities/tenant.entity';
import { FilterTaskDto } from './dto/filter-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksRepository {
  constructor(
    @InjectRepository(Task)
    private readonly repository: Repository<Task>,
  ) {}

  async findAllWithFilters(
    tenantId: string,
    filters: FilterTaskDto,
  ): Promise<[Task[], number]> {
    const {
      status,
      priority,
      projectId,
      assigneeId,
      dueDateFrom,
      dueDateTo,
      tags,
      overdue,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const query = this.repository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.tenantId = :tenantId', { tenantId });

    // Apply filters
    if (status) {
      query.andWhere('task.status = :status', { status });
    }

    if (priority) {
      query.andWhere('task.priority = :priority', { priority });
    }

    if (projectId) {
      query.andWhere('task.projectId = :projectId', { projectId });
    }

    if (assigneeId) {
      query.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }

    if (dueDateFrom || dueDateTo) {
      if (dueDateFrom && dueDateTo) {
        query.andWhere('task.dueDate BETWEEN :dueDateFrom AND :dueDateTo', {
          dueDateFrom,
          dueDateTo,
        });
      } else if (dueDateFrom) {
        query.andWhere('task.dueDate >= :dueDateFrom', { dueDateFrom });
      } else if (dueDateTo) {
        query.andWhere('task.dueDate <= :dueDateTo', { dueDateTo });
      }
    }

    if (tags && tags.length > 0) {
      query.andWhere('task.tags && ARRAY[:...tags]::varchar[]', { tags });
    }

    if (overdue) {
      query.andWhere('task.dueDate < :now', { now: new Date() });
      query.andWhere('task.status != :completedStatus', {
        completedStatus: 'COMPLETED',
      });
    }

    if (search) {
      query.andWhere(
        '(task.title ILIKE :search OR task.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Sorting
    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'title',
      'status',
      'priority',
      'dueDate',
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    query.orderBy(`task.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    return query.getManyAndCount();
  }

  async findById(id: string, tenantId: string): Promise<Task> {
    const task = await this.repository.findOne({
      where: { id, tenantId },
      relations: ['assignee', 'creator', 'project'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async create(taskData: Partial<Task>): Promise<Task> {
    const taskEntity = await this.repository.create(taskData);
    return this.repository.save(taskEntity);
  }

  async update(id: string, tenantId: string, taskData: Partial<UpdateTaskDto>): Promise<Task> {
    await this.repository.update({ id, tenantId }, taskData);
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.repository.softDelete({ id, tenantId });
    return result.affected !== undefined && result.affected > 0;
  }

  async getStatsByStatus(tenantId: string, projectId?: string) {
    const query = this.repository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.tenantId = :tenantId', { tenantId })
      .groupBy('task.status');

    if (projectId) {
      query.andWhere('task.projectId = :projectId', { projectId });
    }

    return query.getRawMany();
  }

  async getOverdueTasks(tenantId: string): Promise<Task[]> {
    return this.repository.find({
      where: {
        tenantId,
        dueDate: LessThan(new Date()),
        status: In(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'BLOCKED']),
      },
      relations: ['assignee', 'project'],
      order: { dueDate: 'ASC' },
    });
  }
}