import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThan, In, SelectQueryBuilder } from 'typeorm';
import { Task } from './entities/task.entity';
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
    const query = this.buildOptimizedQuery(tenantId, filters);
    
    // Use querybuilder for complex queries with proper indexing
    const [tasks, total] = await query.getManyAndCount();
    
    return [tasks, total];
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

  private buildOptimizedQuery(
    tenantId: string,
    filters: FilterTaskDto,
  ): SelectQueryBuilder<Task> {
    const {
      status,
      priority,
      projectId,
      assigneeId,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = filters;

    const query = this.repository
      .createQueryBuilder('task')
      .where('task.tenantId = :tenantId', { tenantId })
      .andWhere('task.deletedAt IS NULL');

    // Apply filters (uses indexes)
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

    // Full-text search (uses GIN index)
    if (search) {
      query.andWhere(
        `to_tsvector('english', task.title || ' ' || COALESCE(task.description, '')) @@ plainto_tsquery('english', :search)`,
        { search },
      );
    }

    // Only load relations if needed (reduces data transfer)
    if (!filters.minimal)
       {
      query
        .leftJoinAndSelect('task.assignee', 'assignee')
        .leftJoinAndSelect('task.project', 'project')
        .leftJoinAndSelect('task.creator', 'creator');
    } else {
      // Minimal mode: only essential fields
      query.select([
        'task.id',
        'task.title',
        'task.status',
        'task.priority',
        'task.dueDate',
      ]);
    }

    // Sorting with index support
    const allowedSortFields: { [key: string]: string } = {
      createdAt: 'task.createdAt',
      updatedAt: 'task.updatedAt',
      title: 'task.title',
      status: 'task.status',
      priority: 'task.priority',
      dueDate: 'task.dueDate',
    };

    const sortField = allowedSortFields[sortBy] || allowedSortFields.createdAt;
    query.orderBy(sortField, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    return query;
  }

  /**
   * Bulk operations for better performance
   */
  async bulkUpdate(ids: string[], tenantId: string, updates: Partial<Task>): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .update(Task)
      .set(updates)
      .where('id IN (:...ids)', { ids })
      .andWhere('tenantId = :tenantId', { tenantId })
      .execute();
  }

  /**
   * Efficient count query
   */
  async countByStatus(tenantId: string): Promise<Record<string, number>> {
    const results = await this.repository
      .createQueryBuilder('task')
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('task.tenantId = :tenantId', { tenantId })
      .andWhere('task.deletedAt IS NULL')
      .groupBy('task.status')
      .getRawMany();

    return results.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count, 10);
      return acc;
    }, {});
  }
}