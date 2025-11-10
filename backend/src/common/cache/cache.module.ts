import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import cacheConfig from '@config/cache.config';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule.forFeature(cacheConfig)],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const config = configService.get('cache');
        return {
          store: await config.store({
            socket: {
              host: config.host,
              port: config.port,
            },
            password: config.password,
            database: config.db,
          }),
          ttl: config.ttl * 1000, // Convert to milliseconds
          max: config.max,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
  providers: [CacheService],
})
export class CacheModule {}