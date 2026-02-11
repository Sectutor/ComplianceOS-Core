/**
 * Enhanced Database Module with Enterprise Scalability
 * 
 * This module replaces the basic database connection with enterprise-grade
 * connection management, caching, and performance monitoring.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DatabaseManager, createDatabaseConfig } from "./lib/database/config";
import { CacheManager, createCacheConfig, CacheKeys } from "./lib/cache/manager";
import * as schema from "./schema";

// Global instances
let dbManager: DatabaseManager | null = null;
let cacheManager: CacheManager | null = null;
let primaryDb: ReturnType<typeof drizzle> | null = null;
let readDb: ReturnType<typeof drizzle> | null = null;

/**
 * Database connection error class
 */
export class DatabaseConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Initialize enterprise database and cache infrastructure
 */
export async function initializeDatabase(): Promise<void> {
  console.log('[DB] Initializing enterprise database infrastructure...');

  try {
    // Initialize database manager
    const dbConfig = createDatabaseConfig();
    dbManager = new DatabaseManager(dbConfig);
    const connections = await dbManager.initialize();

    // Initialize Drizzle ORM instances
    primaryDb = drizzle(connections.primary, { schema });
    if (connections.read) {
      readDb = drizzle(connections.read, { schema });
    }

    // Initialize cache manager
    const cacheConfig = createCacheConfig();
    cacheManager = new CacheManager(cacheConfig);
    await cacheManager.initialize();

    console.log('[DB] Enterprise database infrastructure initialized successfully');
  } catch (error) {
    console.error('[DB] Failed to initialize database infrastructure:', error);
    throw new DatabaseConnectionError(`Initialization failed: ${error}`);
  }
}

/**
 * Get primary database instance for writes
 */
export function getPrimaryDb(): NonNullable<typeof primaryDb> {
  if (!primaryDb) {
    throw new DatabaseConnectionError("Primary database not initialized");
  }
  return primaryDb;
}

/**
 * Get read database instance for queries (falls back to primary)
 */
export function getReadDb(): NonNullable<typeof primaryDb> {
  return readDb || getPrimaryDb();
}

/**
 * Get cache manager instance
 */
export function getCacheManager(): NonNullable<typeof cacheManager> {
  if (!cacheManager) {
    throw new DatabaseConnectionError("Cache manager not initialized");
  }
  return cacheManager;
}

/**
 * Get database manager for advanced operations
 */
export function getDbManager(): NonNullable<typeof dbManager> {
  if (!dbManager) {
    throw new DatabaseConnectionError("Database manager not initialized");
  }
  return dbManager;
}

/**
 * Enhanced database query with caching and performance monitoring
 */
export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options?: {
    ttl?: number;
    forceRefresh?: boolean;
    clientId?: number;
  }
): Promise<T> {
  const cache = getCacheManager();
  const db = getDbManager();

  // Try cache first (unless force refresh)
  if (!options?.forceRefresh) {
    const cached = await cache.get<T>(key);
    if (cached !== null) {
      console.log(`[CACHE] Hit for key: ${key}`);
      return cached;
    }
  }

  // Execute query with performance monitoring
  const startTime = Date.now();
  let result: T;
  let success = true;

  try {
    result = await queryFn();
  } catch (error) {
    success = false;
    throw error;
  } finally {
    const duration = Date.now() - startTime;
    db.recordQuery(key, duration, success);
  }

  // Cache the result
  await cache.set(key, result, options?.ttl);
  console.log(`[CACHE] Set for key: ${key}`);

  return result;
}

/**
 * Health check for database and cache infrastructure
 */
export async function healthCheck(): Promise<{
  database: { primary: boolean; read?: boolean; metrics: any };
  cache: { healthy: boolean; metrics: any; redisConnected: boolean };
}> {
  const db = getDbManager();
  const cache = getCacheManager();

  const [dbHealth, cacheHealth] = await Promise.all([
    db.healthCheck(),
    cache.healthCheck(),
  ]);

  return {
    database: dbHealth,
    cache: cacheHealth,
  };
}

/**
 * Graceful shutdown of database and cache infrastructure
 */
export async function shutdownDatabase(): Promise<void> {
  console.log('[DB] Shutting down enterprise database infrastructure...');

  const shutdownPromises = [];

  if (dbManager) {
    shutdownPromises.push(dbManager.shutdown());
  }

  if (cacheManager) {
    shutdownPromises.push(cacheManager.shutdown());
  }

  await Promise.all(shutdownPromises);
  console.log('[DB] Enterprise database infrastructure shutdown complete');
}

/**
 * Backward compatibility - enhanced getDb function
 */
export async function getDb(): Promise<NonNullable<typeof primaryDb>> {
  if (!primaryDb) {
    throw new DatabaseConnectionError("Database not initialized. Call initializeDatabase() first.");
  }
  return primaryDb;
}

// Export cache keys for easy access
export { CacheKeys };