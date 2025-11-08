import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DLQService } from './dlq.service';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@ApiTags('Dead Letter Queue')
@ApiBearerAuth('JWT-auth')
@Roles(UserRole.ADMIN)
@Controller('dlq')
export class DLQController {
  constructor(private readonly dlqService: DLQService) {}

  @Get()
  @ApiOperation({ summary: 'Get all unresolved dead letters' })
  findUnresolved(@Query('limit') limit?: number) {
    return this.dlqService.findUnresolved(limit);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get DLQ statistics' })
  getStats() {
    return this.dlqService.getStats();
  }

  @Get('event/:eventType')
  @ApiOperation({ summary: 'Get dead letters by event type' })
  findByEventType(@Param('eventType') eventType: string) {
    return this.dlqService.findByEventType(eventType);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: 'Retry a dead letter message' })
  retryMessage(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dlqService.retryMessage(id, userId);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Mark dead letter as resolved' })
  markAsResolved(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body('notes') notes: string,
  ) {
    return this.dlqService.markAsResolved(id, userId, notes);
  }
}