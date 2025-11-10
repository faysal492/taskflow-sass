import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CacheService } from '@common/cache/cache.service';
import { CacheKeys } from '@common/cache/cache-keys';

export const RATE_LIMIT_KEY = 'rate_limit';

export interface RateLimitOptions {
  limit: number;
  ttl: number; // seconds
  keyPrefix?: string;
}

export const RateLimit = (options: RateLimitOptions) => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, target);
    return target;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitOptions = this.reflector.get(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);
    const key = CacheKeys.rateLimit(
      `${rateLimitOptions.keyPrefix || 'default'}:${identifier}`,
    );

    const currentCount = await this.cacheService.increment(key, 1);

    if (currentCount === 1) {
      // First request, set TTL
      await this.cacheService.setEx(key, currentCount, rateLimitOptions.ttl);
    }

    if (currentCount > rateLimitOptions.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests',
          retryAfter: rateLimitOptions.ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', rateLimitOptions.limit);
    response.setHeader('X-RateLimit-Remaining', Math.max(0, rateLimitOptions.limit - currentCount));
    response.setHeader('X-RateLimit-Reset', Date.now() + rateLimitOptions.ttl * 1000);

    return true;
  }

  private getIdentifier(request: any): string {
    // Use user ID if authenticated, otherwise IP address
    return request.user?.id || request.ip || 'anonymous';
  }
}