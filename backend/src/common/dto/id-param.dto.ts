import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class IdParamDto {
  @ApiProperty({ description: 'UUID identifier' })
  @IsUUID('4')
  id: string;
}