import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { CacheService } from '../cache.service';
import { CACHE_KEY_METADATA, CACHE_TTL_METADATA } from '../decorators/cacheable.decorator';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);

  constructor(
    private cacheService: CacheService,
    private reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<CacheService>> {
    const cacheKey = this.reflector.get(
      CACHE_KEY_METADATA,
      context.getHandler(),
    );

    if (!cacheKey) {
      return next.handle();
    }

    const ttl = this.reflector.get(
      CACHE_TTL_METADATA,
      context.getHandler(),
    );

    const request = context.switchToHttp().getRequest();
    const fullKey = this.buildCacheKey(cacheKey, request);

    // Try to get from cache
    const cachedValue = await this.cacheService.get(fullKey);
    if (cachedValue !== undefined) {
      this.logger.debug(`Cache HIT: ${fullKey}`);
      return of(cachedValue);
    }

    this.logger.debug(`Cache MISS: ${fullKey}`);

    // Execute handler and cache result
    return next.handle().pipe(
      tap(async (response) => {
        await this.cacheService.set(fullKey, response, ttl);
      }),
    );
  }

  private buildCacheKey(pattern: string, request: any): string {
    let key = pattern;
    
    // Replace placeholders
    if (request.params) {
      Object.keys(request.params).forEach((param) => {
        key = key.replace(`:${param}`, request.params[param]);
      });
    }
    
    if (request.user) {
      key = key.replace(':userId', request.user.id);
      key = key.replace(':tenantId', request.user.tenantId);
    }
    
    // Add query params for list endpoints
    if (request.query && Object.keys(request.query).length > 0) {
      const queryString = Object.keys(request.query)
        .sort()
        .map((k) => `${k}=${request.query[k]}`)
        .join('&');
      key = `${key}?${queryString}`;
    }
    
    return key;
  }
}