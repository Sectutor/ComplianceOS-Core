/**
 * Enterprise Database Configuration
 * 
 * This module provides scalable database connection management for enterprise deployments.
 * Supports connection pooling, read replicas, and performance monitoring.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../schema';

export interface DatabaseConfig {
  primary: {
    url: string;
    maxConnections: number;
    idleTimeout: number;
    statementTimeout: number;
    connectionTimeout: number;
  };
  readReplica?: {
    url: string;
    maxConnections: number;
    idleTimeout: number;
  };
  poolMonitoring: {
    enabled: boolean;
    collectInterval: number;
    alertThresholds: {
      connectionUsage: number;
      queryTimeout: number;
      errorRate: number;
    };
  };
}

export interface ConnectionPoolMetrics {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  averageWaitTime: number;
  errorRate: number;
  queryThroughput: number;
  timestamp: Date;
}

export class DatabaseManager {
  private primarySql: postgres.Sql | null = null;
  private readReplicaSql: postgres.Sql | null = null;
  private metrics: ConnectionPoolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    waitingRequests: 0,
    averageWaitTime: 0,
    errorRate: 0,
    queryThroughput: 0,
    timestamp: new Date(),
  };
  private metricsInterval: NodeJS.Timeout | null = null;
  private queryStats = new Map<string, { count: number; avgTime: number; errors: number }>();

  constructor(private config: DatabaseConfig) {}

  /**
   * Initialize database connections with enterprise configuration
   */
  async initialize(): Promise<{ primary: postgres.Sql; read?: postgres.Sql }> {
    try {
      // Primary database connection
      this.primarySql = postgres(this.config.primary.url, {
        ssl: { rejectUnauthorized: false },
        prepare: false,
        idle_timeout: this.config.primary.idleTimeout,
        connect_timeout: this.config.primary.connectionTimeout,
        max: this.config.primary.maxConnections,
        connection: {
          statement_timeout: this.config.primary.statementTimeout,
          application_name: 'compliance-os-primary',
        },
        onconnect: (client) => {
          console.log(`[DB] Primary connection established: ${client.processID}`);
        },
        onclose: (client) => {
          console.log(`[DB] Primary connection closed: ${client.processID}`);
        },
      });

      // Read replica connection (if configured)
      if (this.config.readReplica?.url) {
        this.readReplicaSql = postgres(this.config.readReplica.url, {
          ssl: { rejectUnauthorized: false },
          prepare: false,
          idle_timeout: this.config.readReplica.idleTimeout,
          connect_timeout: 30,
          max: this.config.readReplica.maxConnections,
          connection: {
            statement_timeout: 60000, // Longer timeout for read queries
            application_name: 'compliance-os-read',
          },
          onconnect: (client) => {
            console.log(`[DB] Read replica connection established: ${client.processID}`);
          },
          onclose: (client) => {
            console.log(`[DB] Read replica connection closed: ${client.processID}`);
          },
        });
      }

      // Start metrics collection
      if (this.config.poolMonitoring.enabled) {
        this.startMetricsCollection();
      }

      console.log('[DB] Database connections initialized successfully');
      return {
        primary: this.primarySql,
        read: this.readReplicaSql || undefined,
      };
    } catch (error) {
      console.error('[DB] Database connection failed:', error);
      throw new Error(`Database initialization failed: ${error}`);
    }
  }

  /**
   * Get primary database connection for writes
   */
  getPrimaryConnection(): postgres.Sql {
    if (!this.primarySql) {
      throw new Error('Primary database connection not initialized');
    }
    return this.primarySql;
  }

  /**
   * Get read replica connection for queries (falls back to primary)
   */
  getReadConnection(): postgres.Sql {
    return this.readReplicaSql || this.getPrimaryConnection();
  }

  /**
   * Start collecting connection pool metrics
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.poolMonitoring.collectInterval);
  }

  /**
   * Collect current connection pool metrics
   */
  private collectMetrics(): void {
    // This would integrate with postgres driver internals
    // For now, we'll track basic query statistics
    const now = new Date();
    
    // Calculate throughput (queries per second)
    const timeDiff = (now.getTime() - this.metrics.timestamp.getTime()) / 1000;
    const currentThroughput = this.queryStats.size / timeDiff;

    this.metrics = {
      ...this.metrics,
      timestamp: now,
      queryThroughput: currentThroughput,
      // These would come from actual pool monitoring
      totalConnections: this.config.primary.maxConnections,
      activeConnections: Math.floor(this.config.primary.maxConnections * 0.7), // Simulated
      idleConnections: Math.floor(this.config.primary.maxConnections * 0.3), // Simulated
    };

    // Check alert thresholds
    this.checkAlertThresholds();
  }

  /**
   * Check if metrics exceed alert thresholds
   */
  private checkAlertThresholds(): void {
    const { alertThresholds } = this.config.poolMonitoring;
    
    if (this.metrics.activeConnections / this.metrics.totalConnections > alertThresholds.connectionUsage) {
      console.warn(`[DB ALERT] High connection pool usage: ${this.metrics.activeConnections}/${this.metrics.totalConnections}`);
    }

    if (this.metrics.errorRate > alertThresholds.errorRate) {
      console.error(`[DB ALERT] High error rate: ${this.metrics.errorRate}%`);
    }
  }

  /**
   * Record query performance statistics
   */
  recordQuery(query: string, duration: number, success: boolean): void {
    const queryKey = query.substring(0, 50); // Truncate for storage
    const stats = this.queryStats.get(queryKey) || { count: 0, avgTime: 0, errors: 0 };
    
    stats.count++;
    stats.avgTime = (stats.avgTime * (stats.count - 1) + duration) / stats.count;
    if (!success) stats.errors++;
    
    this.queryStats.set(queryKey, stats);
  }

  /**
   * Get current connection pool metrics
   */
  getMetrics(): ConnectionPoolMetrics {
    return { ...this.metrics };
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): Map<string, { count: number; avgTime: number; errors: number }> {
    return new Map(this.queryStats);
  }

  /**
   * Health check for database connections
   */
  async healthCheck(): Promise<{ primary: boolean; read?: boolean; metrics: ConnectionPoolMetrics }> {
    try {
      const primaryHealthy = await this.testConnection(this.primarySql);
      const readHealthy = this.readReplicaSql ? await this.testConnection(this.readReplicaSql) : undefined;
      
      return {
        primary: primaryHealthy,
        read: readHealthy,
        metrics: this.getMetrics(),
      };
    } catch (error) {
      console.error('[DB] Health check failed:', error);
      throw error;
    }
  }

  /**
   * Test database connection
   */
  private async testConnection(sql: postgres.Sql | null): Promise<boolean> {
    if (!sql) return false;
    
    try {
      await sql`SELECT 1`;
      return true;
    } catch (error) {
      console.error('[DB] Connection test failed:', error);
      return false;
    }
  }

  /**
   * Gracefully shutdown database connections
   */
  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    const shutdownPromises = [];
    
    if (this.primarySql) {
      shutdownPromises.push(this.primarySql.end());
    }
    
    if (this.readReplicaSql) {
      shutdownPromises.push(this.readReplicaSql.end());
    }

    await Promise.all(shutdownPromises);
    console.log('[DB] Database connections closed');
  }
}

/**
 * Create enterprise database configuration
 */
export function createDatabaseConfig(): DatabaseConfig {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    primary: {
      url: process.env.DATABASE_URL!,
      maxConnections: isProduction ? 100 : 20,
      idleTimeout: 30, // 30 seconds
      statementTimeout: isProduction ? 10000 : 15000, // 10-15 seconds
      connectionTimeout: 30, // 30 seconds
    },
    readReplica: process.env.DATABASE_READ_URL ? {
      url: process.env.DATABASE_READ_URL,
      maxConnections: isProduction ? 50 : 10,
      idleTimeout: 60, // 60 seconds for read queries
    } : undefined,
    poolMonitoring: {
      enabled: true,
      collectInterval: 30000, // 30 seconds
      alertThresholds: {
        connectionUsage: 0.8, // 80% usage
        queryTimeout: 5000, // 5 seconds
        errorRate: 0.05, // 5% error rate
      },
    },
  };
}