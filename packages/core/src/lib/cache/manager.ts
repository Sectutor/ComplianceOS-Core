/**
 * Redis Caching Layer for Enterprise Scale
 * 
 * This module provides multi-tier caching with Redis for hot data,
 * session management, and API response caching.
 */

import Redis from 'ioredis';

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    cluster?: boolean;
    sentinel?: boolean;
  };
  tiers: Array<{
    type: 'memory' | 'redis';
    ttl: number;
    maxSize?: number;
    keyPrefix?: string;
  }>;
  monitoring: {
    enabled: boolean;
    collectInterval: number;
    alertThresholds: {
      hitRate: number;
      memoryUsage: number;
      errorRate: number;
    };
  };
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  memoryUsage: number;
  totalRequests: number;
  errorRate: number;
  timestamp: Date;
}

export class CacheManager {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { value: any; expires: number }>();
  private metrics: CacheMetrics = {
    hitRate: 0,
    missRate: 0,
    evictionRate: 0,
    memoryUsage: 0,
    totalRequests: 0,
    errorRate: 0,
    timestamp: new Date(),
  };
  private metricsInterval: NodeJS.Timeout | null = null;
  private requestStats = { hits: 0, misses: 0, errors: 0 };

  constructor(private config: CacheConfig) {}

  /**
   * Initialize Redis connection and start monitoring
   */
  async initialize(): Promise<void> {
    try {
      this.redis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        connectTimeout: 10000,
        commandTimeout: 5000,
        enableOfflineQueue: false,
        maxmemoryPolicy: 'allkeys-lru',
      });

      await this.redis.connect();
      console.log('[CACHE] Redis connection established');

      if (this.config.monitoring.enabled) {
        this.startMetricsCollection();
      }
    } catch (error) {
      console.error('[CACHE] Failed to initialize Redis:', error);
      // Continue without Redis - fallback to memory only
      this.redis = null;
    }
  }

  /**
   * Get value from cache (multi-tier lookup)
   */
  async get<T>(key: string): Promise<T | null> {
    const startTime = Date.now();
    
    try {
      // L1: Memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && memoryEntry.expires > Date.now()) {
        this.requestStats.hits++;
        return memoryEntry.value;
      } else if (memoryEntry) {
        // Expired entry - remove from memory
        this.memoryCache.delete(key);
      }

      // L2: Redis cache
      if (this.redis) {
        const redisValue = await this.redis.get(key);
        if (redisValue) {
          const parsed = JSON.parse(redisValue);
          
          // Promote to memory cache
          this.memoryCache.set(key, {
            value: parsed,
            expires: Date.now() + (this.config.tiers[0]?.ttl || 60) * 1000,
          });

          this.requestStats.hits++;
          return parsed;
        }
      }

      this.requestStats.misses++;
      return null;
    } catch (error) {
      this.requestStats.errors++;
      console.error(`[CACHE] Get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set value in cache (multi-tier storage)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const effectiveTtl = ttl || this.config.tiers[1]?.ttl || 300;
    
    try {
      // L1: Memory cache
      this.memoryCache.set(key, {
        value,
        expires: Date.now() + effectiveTtl * 1000,
      });

      // L2: Redis cache
      if (this.redis) {
        await this.redis.setex(key, effectiveTtl, JSON.stringify(value));
      }

      // Memory cache cleanup
      this.cleanupMemoryCache();
    } catch (error) {
      console.error(`[CACHE] Set error for key ${key}:`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    try {
      this.memoryCache.delete(key);
      
      if (this.redis) {
        await this.redis.del(key);
      }
    } catch (error) {
      console.error(`[CACHE] Delete error for key ${key}:`, error);
    }
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    try {
      this.memoryCache.clear();
      
      if (this.redis) {
        await this.redis.flushdb();
      }
    } catch (error) {
      console.error('[CACHE] Clear error:', error);
    }
  }

  /**
   * Clean up expired memory cache entries
   */
  private cleanupMemoryCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.memoryCache.entries()) {
      if (entry.expires <= now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Start collecting cache metrics
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoring.collectInterval);
  }

  /**
   * Collect current cache performance metrics
   */
  private collectMetrics(): void {
    const totalRequests = this.requestStats.hits + this.requestStats.misses;
    
    this.metrics = {
      hitRate: totalRequests > 0 ? (this.requestStats.hits / totalRequests) * 100 : 0,
      missRate: totalRequests > 0 ? (this.requestStats.misses / totalRequests) * 100 : 0,
      evictionRate: 0, // Would track Redis evictions
      memoryUsage: this.memoryCache.size,
      totalRequests,
      errorRate: this.requestStats.errors,
      timestamp: new Date(),
    };

    // Check alert thresholds
    this.checkAlertThresholds();

    // Reset stats for next interval
    this.requestStats = { hits: 0, misses: 0, errors: 0 };
  }

  /**
   * Check if metrics exceed alert thresholds
   */
  private checkAlertThresholds(): void {
    const { alertThresholds } = this.config.monitoring;
    
    if (this.metrics.hitRate < alertThresholds.hitRate) {
      console.warn(`[CACHE ALERT] Low cache hit rate: ${this.metrics.hitRate.toFixed(2)}%`);
    }

    if (this.metrics.memoryUsage > alertThresholds.memoryUsage) {
      console.warn(`[CACHE ALERT] High memory usage: ${this.metrics.memoryUsage} entries`);
    }

    if (this.metrics.errorRate > alertThresholds.errorRate) {
      console.error(`[CACHE ALERT] High error rate: ${this.metrics.errorRate}`);
    }
  }

  /**
   * Get current cache performance metrics
   */
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): Promise<{ healthy: boolean; metrics: CacheMetrics; redisConnected: boolean }> {
    let redisHealthy = false;
    
    if (this.redis) {
      try {
        await this.redis.ping();
        redisHealthy = true;
      } catch (error) {
        console.error('[CACHE] Redis health check failed:', error);
      }
    }

    return {
      healthy: redisHealthy || this.memoryCache.size > 0,
      metrics: this.getMetrics(),
      redisConnected: redisHealthy,
    };
  }

  /**
   * Gracefully shutdown cache system
   */
  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.redis) {
      await this.redis.disconnect();
      console.log('[CACHE] Redis connection closed');
    }

    this.memoryCache.clear();
    console.log('[CACHE] Cache system shutdown');
  }
}

/**
 * Create enterprise cache configuration
 */
export function createCacheConfig(): CacheConfig {
  return {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      cluster: process.env.REDIS_CLUSTER === 'true',
      sentinel: process.env.REDIS_SENTINEL === 'true',
    },
    tiers: [
      { type: 'memory', ttl: 60, maxSize: 1000 }, // L1: 1 minute, 1000 entries
      { type: 'redis', ttl: 300, keyPrefix: 'compliance:' }, // L2: 5 minutes
    ],
    monitoring: {
      enabled: true,
      collectInterval: 30000, // 30 seconds
      alertThresholds: {
        hitRate: 70, // 70% minimum hit rate
        memoryUsage: 800, // 800 entries max in memory
        errorRate: 0.02, // 2% maximum error rate
      },
    },
  };
}

/**
 * Cache keys for common data patterns
 */
export const CacheKeys = {
  dashboard: (clientId: number) => `dashboard:${clientId}`,
  complianceScore: (clientId: number) => `compliance:score:${clientId}`,
  riskRegister: (clientId: number) => `risk:register:${clientId}`,
  controls: (clientId: number) => `controls:${clientId}`,
  policies: (clientId: number) => `policies:${clientId}`,
  evidence: (clientId: number, evidenceId: string) => `evidence:${clientId}:${evidenceId}`,
  userSession: (userId: string) => `session:user:${userId}`,
  clientConfig: (clientId: number) => `config:client:${clientId}`,
  framework: (frameworkId: string) => `framework:${frameworkId}`,
  threatIntel: (threatId: string) => `threat:${threatId}`,
  vendor: (vendorId: string) => `vendor:${vendorId}`,
  apiResponse: (endpoint: string, params: string) => `api:${endpoint}:${this.hashParams(params)}`,
} as const;

/**
 * Hash function for generating cache keys from parameters
 */
function hashParams(params: string): string {
  let hash = 0;
  for (let i = 0; i < params.length; i++) {
    const char = params.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}