import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'TaskFlow SaaS' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Multi-tenant task management platform' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'TASK' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(10)
  @Matches(/^[A-Z]+$/, { message: 'Key must be uppercase letters only' })
  key: string;

  @ApiPropertyOptional({ example: '#1890ff' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-F]{6}$/i, { message: 'Invalid color format' })
  color?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  endDate?: string;
}