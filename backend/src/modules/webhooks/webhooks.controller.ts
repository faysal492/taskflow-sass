import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WebhooksService } from './webhooks.service';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';

@ApiTags('Webhooks')
@ApiBearerAuth('JWT-auth')
@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create webhook' })
  create(
    @CurrentTenant() tenantId: string,
    @Body() createWebhookDto: CreateWebhookDto,
  ) {
    return this.webhooksService.create(tenantId, createWebhookDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all webhooks' })
  findAll(@CurrentTenant() tenantId: string) {
    return this.webhooksService.findByTenant(tenantId);
  }

  @Get(':id/deliveries')
  @ApiOperation({ summary: 'Get webhook deliveries' })
  getDeliveries(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    return this.webhooksService.getDeliveries(id, tenantId, limit);
  }

  @Post('deliveries/:id/retry')
  @ApiOperation({ summary: 'Retry failed delivery' })
  retryDelivery(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.webhooksService.retryDelivery(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update webhook' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() updateWebhookDto: Partial<CreateWebhookDto>,
  ) {
    return this.webhooksService.update(id, tenantId, updateWebhookDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete webhook' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.webhooksService.delete(id, tenantId);
  }
}