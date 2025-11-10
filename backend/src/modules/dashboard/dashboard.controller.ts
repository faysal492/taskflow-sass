import { Controller, Get, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { CurrentTenant } from '@common/decorators/current-tenant.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Roles } from '@common/decorators/roles.decorator';
import { UserRole } from '@common/enums/user-role.enum';

@ApiTags('Dashboard')
@ApiBearerAuth('JWT-auth')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getStats(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.dashboardService.getStats(tenantId, userId);
  }

  @Get('stats/tenant')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get tenant-wide dashboard statistics' })
  getTenantStats(@CurrentTenant() tenantId: string) {
    return this.dashboardService.getStats(tenantId);
  }

  @Delete('cache')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Invalidate dashboard cache' })
  async invalidateCache(
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.dashboardService.invalidateCache(tenantId, userId);
  }
}