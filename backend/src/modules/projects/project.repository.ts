import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Between, LessThan, In, SelectQueryBuilder } from 'typeorm';
import { Project } from './entities/project.entity';
import { UpdateProjectDto } from './dto/update-project.dto';


@Injectable()
export class ProjectRepository {
  constructor(
    @InjectRepository(Project)
    private readonly repository: Repository<Project>,
  ) {}


  async findById(id: string, tenantId: string): Promise<Project> {
    const project = await this.repository.findOne({
      where: { id, tenantId },
      relations: ['assignee', 'creator', 'project'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async create(projectData: Partial<Project>): Promise<Project> {
    const projectEntity = await this.repository.create(projectData);
    return this.repository.save(projectEntity);
  }

  async update(id: string, tenantId: string, projectData: Partial<UpdateProjectDto>): Promise<Project> {
    await this.repository.update({ id, tenantId }, projectData);
    return this.findById(id, tenantId);
  }

  async delete(id: string, tenantId: string): Promise<boolean> {
    const result = await this.repository.softDelete({ id, tenantId });
    return result.affected !== undefined && result.affected > 0;
  }
}
