import { createClient, RedisClientType } from 'redis';

class CacheService {
  private client: RedisClientType | null = null;
  private memoryCache: Map<string, { value: unknown; expiry: number }> = new Map();
  private isConnected = false;

  async connect(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    
    if (redisUrl) {
      try {
        this.client = createClient({ url: redisUrl });
        await this.client.connect();
        this.isConnected = true;
        console.log('Redis cache connected');
      } catch (error) {
        console.warn('Redis connection failed, using in-memory cache:', error);
        this.isConnected = false;
      }
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.client) {
      try {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('Cache get error:', error);
      }
    }

    const item = this.memoryCache.get(key);
    if (item && item.expiry > Date.now()) {
      return item.value as T;
    }
    
    this.memoryCache.delete(key);
    return null;
  }

  async set(key: string, value: unknown, ttlSeconds: number = 3600): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000;

    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
      } catch (error) {
        console.error('Cache set error:', error);
      }
    }

    this.memoryCache.set(key, { value, expiry });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (error) {
        console.error('Cache del error:', error);
      }
    }
    this.memoryCache.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } catch (error) {
        console.error('Cache invalidate error:', error);
      }
    }

    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryCache.delete(key);
      }
    }
  }

  generateCacheKey(prefix: string, ...parts: string[]): string {
    return `${prefix}:${parts.map(p => p.toLowerCase().replace(/\s+/g, '-')).join(':')}`;
  }

  getStatus(): boolean {
    return this.isConnected;
  }
}

export const cacheService = new CacheService();
