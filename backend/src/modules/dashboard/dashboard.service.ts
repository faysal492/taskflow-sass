import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Not, In, Between } from 'typeorm';
import { CacheService } from '@common/cache/cache.service';
import { CacheKeys, CacheTTL } from '@common/cache/cache-keys';
import { Task } from '@modules/tasks/entities/task.entity';
import { Project } from '@modules/projects/entities/project.entity';
import { User } from '@modules/users/entities/user.entity';

export interface DashboardStats {
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    completed: number;
    overdue: number;
  };
  projects: {
    total: number;
    active: number;
  };
  team: {
    total: number;
    active: number;
  };
  recentActivity: any[];
  upcomingTasks: Task[];
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Task)
    private taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private cacheService: CacheService,
  ) {}

  async getStats(tenantId: string, userId?: string): Promise<DashboardStats> {
    const cacheKey = CacheKeys.dashboard(tenantId, userId);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        this.logger.debug(`Fetching dashboard stats for tenant ${tenantId}`);

        const [tasks, projects, users, upcomingTasks] = await Promise.all([
          this.getTaskStats(tenantId, userId),
          this.getProjectStats(tenantId),
          this.getTeamStats(tenantId),
          this.getUpcomingTasks(tenantId, userId),
        ]);

        return {
          tasks,
          projects,
          team: users,
          recentActivity: [], // TODO: Implement activity log
          upcomingTasks,
        };
      },
      CacheTTL.SHORT, // Dashboard refreshes frequently
    );
  }

  private async getTaskStats(tenantId: string, userId?: string) {
    const where: any = { tenantId };
    if (userId) {
      where.assigneeId = userId;
    }

    const [total, todo, inProgress, completed, overdue] = await Promise.all([
      this.taskRepo.count({ where }),
      this.taskRepo.count({ where: { ...where, status: 'TODO' } }),
      this.taskRepo.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.taskRepo.count({ where: { ...where, status: 'COMPLETED' } }),
      this.taskRepo.count({
        where: {
          ...where,
          dueDate: LessThan(new Date()),
          status: Not(In(['COMPLETED', 'CANCELLED'])),
        },
      }),
    ]);

    return { total, todo, inProgress, completed, overdue };
  }

  private async getProjectStats(tenantId: string) {
    const [total, active] = await Promise.all([
      this.projectRepo.count({ where: { tenantId } }),
      this.projectRepo.count({ where: { tenantId, isActive: true } }),
    ]);

    return { total, active };
  }

  private async getTeamStats(tenantId: string) {
    const [total, active] = await Promise.all([
      this.userRepo.count({ where: { tenantId } }),
      this.userRepo.count({ where: { tenantId, isActive: true } }),
    ]);

    return { total, active };
  }

  private async getUpcomingTasks(tenantId: string, userId?: string): Promise<Task[]> {
    const where: any = { tenantId };
    if (userId) {
      where.assigneeId = userId;
    }

    return this.taskRepo.find({
      where: {
        ...where,
        dueDate: Between(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        status: Not(In(['COMPLETED', 'CANCELLED'])),
      },
      order: { dueDate: 'ASC' },
      take: 10,
      relations: ['project', 'assignee'],
    });
  }

  async invalidateCache(tenantId: string, userId?: string): Promise<void> {
    if (userId) {
      await this.cacheService.del(CacheKeys.dashboard(tenantId, userId));
    } else {
      await this.cacheService.delPattern(CacheKeys.dashboard(tenantId, '*'));
    }
  }
}