import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsUrl, IsArray, IsOptional, IsObject } from 'class-validator';

export class CreateWebhookDto {
  @ApiProperty({ example: 'Task Notifications' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'https://api.example.com/webhooks' })
  @IsUrl()
  url: string;

  @ApiProperty({ 
    example: ['task.created', 'task.updated'],
    description: 'List of events to subscribe to'
  })
  @IsArray()
  @IsString({ each: true })
  events: string[];

  @ApiPropertyOptional({ example: 'your-secret-key' })
  @IsString()
  @IsOptional()
  secret?: string;

  @ApiPropertyOptional({ 
    example: { 'Authorization': 'Bearer token' }
  })
  @IsObject()
  @IsOptional()
  headers?: Record<string, string>;
}