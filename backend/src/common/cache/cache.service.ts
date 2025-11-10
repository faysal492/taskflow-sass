import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get(key: string): Promise<any> {
    try {
      const value = await this.cacheManager.get(key);
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`);
      } else {
        this.logger.debug(`Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache GET error for ${key}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl ? ttl * 1000 : undefined);
      this.logger.debug(`Cache SET: ${key} (TTL: ${ttl || 'default'}s)`);
    } catch (error) {
      this.logger.error(`Cache SET error for ${key}: ${error.message}`);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DEL error for ${key}: ${error.message}`);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) {
        await Promise.all(keys.map((key) => this.del(key)));
        this.logger.debug(`Cache DEL pattern: ${pattern} (${keys.length} keys)`);
      }
    } catch (error) {
      this.logger.error(`Cache DEL pattern error for ${pattern}: ${error.message}`);
    }
  }

  /**
   * Get all keys matching pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const store = this.cacheManager.stores as any;
      if (store.keys) {
        return await store.keys(pattern);
      }
      return [];
    } catch (error) {
      this.logger.error(`Cache KEYS error for ${pattern}: ${error.message}`);
      return [];
    }
  }

  /**
   * Reset entire cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.clear();
      this.logger.warn('Cache RESET: All keys deleted');
    } catch (error) {
      this.logger.error(`Cache RESET error: ${error.message}`);
    }
  }

  /**
   * Wrap function with cache
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    try {
      const cached = await this.get(key);
      if (cached !== undefined) {
        return cached;
      }

      const result = await fn();
      await this.set(key, result, ttl);
      return result;
    } catch (error) {
      this.logger.error(`Cache WRAP error for ${key}: ${error.message}`);
      // If cache fails, still return the function result
      return fn();
    }
  }

  /**
   * Get or set with callback
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    return this.wrap(key, factory, ttl);
  }

  /**
   * Increment counter
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      const store = this.cacheManager.stores as any;
      if (store.client?.incrBy) {
        return await store.client.incrBy(key, amount);
      }
      // Fallback
      const current = (await this.get(key)) || 0;
      const newValue = current + amount;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      this.logger.error(`Cache INCREMENT error for ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Set with expiration
   */
  async setEx<T>(key: string, value: T, seconds: number): Promise<void> {
    await this.set(key, value, seconds);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== undefined;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ keys: number; memory: string }> {
    try {
      const store = this.cacheManager.stores as any;
      const keys = await this.keys('*');
      
      return {
        keys: keys.length,
        memory: 'N/A', // Redis INFO command if needed
      };
    } catch (error) {
      return { keys: 0, memory: 'Error' };
    }
  }
}