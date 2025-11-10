import { registerAs } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

export default registerAs('cache', () => ({
  store: redisStore,
  host: process.env.REDIS_HOST || 'localhost',
  port: typeof process.env.REDIS_PORT === 'string' ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB ?? '', 10) || 0,
  ttl: parseInt(process.env.REDIS_TTL ?? '', 10) || 300, // 5 minutes default
  max: 100, // Maximum number of items in cache
}));