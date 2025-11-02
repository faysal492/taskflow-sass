import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.params.tenantId || request.body.tenantId;

    if (!user || !user.tenantId) {
      throw new ForbiddenException('User is not associated with any tenant');
    }

    if (tenantId && user.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied to this tenant');
    }

    return true;
  }
}
