import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { TaskStatus } from '@common/enums/task-status.enum';
import { Priority } from '@common/enums/priority.enum';
import { SearchQueryDto } from '@common/dto/search-query.dto';

export class FilterTaskDto extends SearchQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: TaskStatus })
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'Filter by priority', enum: Priority })
  @IsEnum(Priority)
  @IsOptional()
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Filter by project ID' })
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by assignee ID' })
  @IsUUID()
  @IsOptional()
  assigneeId?: string;

  @ApiPropertyOptional({ description: 'Filter by due date from' })
  @IsDateString()
  @IsOptional()
  dueDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by due date to' })
  @IsDateString()
  @IsOptional()
  dueDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by tags' })
  @IsArray()
  @IsOptional()
  @Type(() => String)
  tags?: string[];

  @ApiPropertyOptional({ description: 'Show only overdue tasks' })
  @IsOptional()
  @Type(() => Boolean)
  overdue?: boolean;
}