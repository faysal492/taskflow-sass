import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { CacheService } from '@common/cache/cache.service';
import { CacheKeys, CacheTTL } from '@common/cache/cache-keys';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
    private cacheService: CacheService,
  ) {}

  async create(
    tenantId: string,
    userId: string,
    createProjectDto: CreateProjectDto,
  ): Promise<Project> {
    // Check if project key already exists for this tenant
    const existing = await this.projectRepository.findOne({
      where: { tenantId, key: createProjectDto.key },
    });

    if (existing) {
      throw new ConflictException('Project key already exists');
    }

    const project = this.projectRepository.create({
      ...createProjectDto,
      tenantId,
      ownerId: userId,
    });

    return this.projectRepository.save(project);
  }

  async findAll(tenantId: string): Promise<Project[]> {
    const cacheKey = CacheKeys.projectList(tenantId);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        return this.projectRepository.find({
          where: { tenantId },
          relations: ['owner'],
          order: { createdAt: 'DESC' },
        });
      },
      CacheTTL.MEDIUM,
    );
  }


  async findOne(id: string, tenantId: string): Promise<Project> {
    const cacheKey = CacheKeys.project(id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
        const project = await this.projectRepository.findOne({
          where: { id, tenantId },
          relations: ['owner', 'tasks'],
        });

        if (!project) {
          throw new NotFoundException(`Project with ID ${id} not found`);
        }

        return project;
      },
      CacheTTL.LONG, // Projects change less frequently
    );
  }

  async update(
    id: string,
    tenantId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    await this.findOne(id, tenantId);
    await this.projectRepository.update({ id, tenantId }, updateProjectDto);

    // Invalidate caches
    await this.cacheService.del(CacheKeys.project(id));
    await this.cacheService.del(CacheKeys.projectList(tenantId));

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const result = await this.projectRepository.softDelete({ id, tenantId });

    if (result.affected === 0) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
  }
}