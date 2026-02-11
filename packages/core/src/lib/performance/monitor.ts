/**
 * Performance Monitoring Service
 * 
 * This module provides comprehensive performance monitoring and alerting
 * for database queries, API responses, and system health.
 */

import { DatabaseManager } from "./database/config";
import { CacheManager } from "./cache/manager";

export interface PerformanceMetrics {
  database: {
    queryCount: number;
    averageQueryTime: number;
    slowQueries: number;
    errorRate: number;
    connectionPoolUsage: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    evictionRate: number;
    memoryUsage: number;
  };
  api: {
    requestCount: number;
    averageResponseTime: number;
    errorRate: number;
    rateLimitedRequests: number;
  };
  system: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
    activeConnections: number;
  };
  timestamp: Date;
}

export interface PerformanceAlert {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'database' | 'cache' | 'api' | 'system';
  message: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];
  private startTime = Date.now();

  constructor(
    private dbManager: DatabaseManager,
    private cacheManager: CacheManager,
    private config: {
      collectInterval: number;
      alertThresholds: {
        database: {
          slowQueryTime: number;
          errorRate: number;
          connectionUsage: number;
        };
        cache: {
          minHitRate: number;
          maxErrorRate: number;
        };
        api: {
          maxResponseTime: number;
          maxErrorRate: number;
        };
        system: {
          maxMemoryUsage: number;
          maxCpuUsage: number;
        };
      };
    }
  ) {
    this.metrics = {
      database: {
        queryCount: 0,
        averageQueryTime: 0,
        slowQueries: 0,
        errorRate: 0,
        connectionPoolUsage: 0,
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        memoryUsage: 0,
      },
      api: {
        requestCount: 0,
        averageResponseTime: 0,
        errorRate: 0,
        rateLimitedRequests: 0,
      },
      system: {
        memoryUsage: 0,
        cpuUsage: 0,
        uptime: 0,
        activeConnections: 0,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    console.log('[PERF] Starting performance monitoring');
    
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectInterval);

    // Initial collection
    this.collectMetrics();
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    console.log('[PERF] Performance monitoring stopped');
  }

  /**
   * Collect current performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Collect database metrics
      const dbMetrics = this.dbManager.getMetrics();
      const dbStats = this.dbManager.getQueryStats();
      
      let totalQueries = 0;
      let totalTime = 0;
      let slowQueries = 0;
      let totalErrors = 0;

      for (const [query, stats] of dbStats.entries()) {
        totalQueries += stats.count;
        totalTime += stats.avgTime * stats.count;
        totalErrors += stats.errors;
        
        if (stats.avgTime > this.config.alertThresholds.database.slowQueryTime) {
          slowQueries += stats.count;
        }
      }

      this.metrics.database = {
        queryCount: totalQueries,
        averageQueryTime: totalQueries > 0 ? totalTime / totalQueries : 0,
        slowQueries,
        errorRate: totalQueries > 0 ? (totalErrors / totalQueries) * 100 : 0,
        connectionPoolUsage: (dbMetrics.activeConnections / dbMetrics.totalConnections) * 100,
      };

      // Collect cache metrics
      const cacheMetrics = this.cacheManager.getMetrics();
      this.metrics.cache = {
        hitRate: cacheMetrics.hitRate,
        missRate: cacheMetrics.missRate,
        evictionRate: cacheMetrics.evictionRate,
        memoryUsage: cacheMetrics.memoryUsage,
      };

      // Collect system metrics
      this.metrics.system = {
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: await this.getCpuUsage(),
        uptime: (Date.now() - this.startTime) / 1000, // seconds
        activeConnections: dbMetrics.activeConnections,
      };

      this.metrics.timestamp = new Date();

      // Check alert thresholds
      this.checkAlertThresholds();

    } catch (error) {
      console.error('[PERF] Error collecting metrics:', error);
    }
  }

  /**
   * Get CPU usage percentage
   */
  private async getCpuUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const percentage = (totalUsage / 1000000) * 100; // Convert to percentage
        resolve(percentage);
      }, 100);
    });
  }

  /**
   * Check alert thresholds and generate alerts
   */
  private checkAlertThresholds(): void {
    const { alertThresholds } = this.config;

    // Database alerts
    if (this.metrics.database.averageQueryTime > alertThresholds.database.slowQueryTime) {
      this.createAlert(
        'warning',
        'database',
        `Slow database queries detected: ${this.metrics.database.averageQueryTime.toFixed(2)}ms`,
        'averageQueryTime',
        this.metrics.database.averageQueryTime,
        alertThresholds.database.slowQueryTime
      );
    }

    if (this.metrics.database.errorRate > alertThresholds.database.errorRate) {
      this.createAlert(
        'critical',
        'database',
        `High database error rate: ${this.metrics.database.errorRate.toFixed(2)}%`,
        'errorRate',
        this.metrics.database.errorRate,
        alertThresholds.database.errorRate
      );
    }

    if (this.metrics.database.connectionPoolUsage > alertThresholds.database.connectionUsage) {
      this.createAlert(
        'warning',
        'database',
        `High connection pool usage: ${this.metrics.database.connectionPoolUsage.toFixed(2)}%`,
        'connectionPoolUsage',
        this.metrics.database.connectionPoolUsage,
        alertThresholds.database.connectionUsage
      );
    }

    // Cache alerts
    if (this.metrics.cache.hitRate < alertThresholds.cache.minHitRate && this.metrics.cache.hitRate > 0) {
      this.createAlert(
        'warning',
        'cache',
        `Low cache hit rate: ${this.metrics.cache.hitRate.toFixed(2)}%`,
        'hitRate',
        this.metrics.cache.hitRate,
        alertThresholds.cache.minHitRate
      );
    }

    // System alerts
    if (this.metrics.system.memoryUsage > alertThresholds.system.maxMemoryUsage) {
      this.createAlert(
        'critical',
        'system',
        `High memory usage: ${this.metrics.system.memoryUsage.toFixed(2)}MB`,
        'memoryUsage',
        this.metrics.system.memoryUsage,
        alertThresholds.system.maxMemoryUsage
      );
    }

    if (this.metrics.system.cpuUsage > alertThresholds.system.maxCpuUsage) {
      this.createAlert(
        'warning',
        'system',
        `High CPU usage: ${this.metrics.system.cpuUsage.toFixed(2)}%`,
        'cpuUsage',
        this.metrics.system.cpuUsage,
        alertThresholds.system.maxCpuUsage
      );
    }
  }

  /**
   * Create a performance alert
   */
  private createAlert(
    severity: PerformanceAlert['severity'],
    category: PerformanceAlert['category'],
    message: string,
    metric: string,
    value: number,
    threshold: number
  ): void {
    const alert: PerformanceAlert = {
      id: `${category}-${metric}-${Date.now()}`,
      severity,
      category,
      message,
      metric,
      value,
      threshold,
      timestamp: new Date(),
    };

    this.alerts.push(alert);

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Notify callbacks
    this.alertCallbacks.forEach(callback => callback(alert));

    // Log alert
    const logLevel = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info';
    console[logLevel](`[PERF ALERT] ${message}`);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent performance alerts
   */
  getAlerts(limit = 50): PerformanceAlert[] {
    return this.alerts.slice(-limit);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: PerformanceAlert['severity']): PerformanceAlert[] {
    return this.alerts.filter(alert => alert.severity === severity);
  }

  /**
   * Add alert callback
   */
  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Record API request performance
   */
  recordApiRequest(endpoint: string, duration: number, success: boolean): void {
    this.metrics.api.requestCount++;
    
    // Update average response time (exponential moving average)
    const alpha = 0.2;
    this.metrics.api.averageResponseTime = 
      this.metrics.api.averageResponseTime * (1 - alpha) + duration * alpha;

    if (!success) {
      this.metrics.api.errorRate = Math.min(100, this.metrics.api.errorRate + 0.1);
    } else {
      this.metrics.api.errorRate = Math.max(0, this.metrics.api.errorRate - 0.01);
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    
    return `
# HELP database_query_count Total number of database queries
# TYPE database_query_count counter
database_query_count ${metrics.database.queryCount}

# HELP database_average_query_time Average database query time in milliseconds
# TYPE database_average_query_time gauge
database_average_query_time ${metrics.database.averageQueryTime}

# HELP database_slow_queries Number of slow database queries
# TYPE database_slow_queries counter
database_slow_queries ${metrics.database.slowQueries}

# HELP database_error_rate Database error rate percentage
# TYPE database_error_rate gauge
database_error_rate ${metrics.database.errorRate}

# HELP database_connection_pool_usage Connection pool usage percentage
# TYPE database_connection_pool_usage gauge
database_connection_pool_usage ${metrics.database.connectionPoolUsage}

# HELP cache_hit_rate Cache hit rate percentage
# TYPE cache_hit_rate gauge
cache_hit_rate ${metrics.cache.hitRate}

# HELP cache_miss_rate Cache miss rate percentage
# TYPE cache_miss_rate gauge
cache_miss_rate ${metrics.cache.missRate}

# HELP api_average_response_time Average API response time in milliseconds
# TYPE api_average_response_time gauge
api_average_response_time ${metrics.api.averageResponseTime}

# HELP api_error_rate API error rate percentage
# TYPE api_error_rate gauge
api_error_rate ${metrics.api.errorRate}

# HELP system_memory_usage Memory usage in MB
# TYPE system_memory_usage gauge
system_memory_usage ${metrics.system.memoryUsage}

# HELP system_cpu_usage CPU usage percentage
# TYPE system_cpu_usage gauge
system_cpu_usage ${metrics.system.cpuUsage}

# HELP system_uptime_seconds System uptime in seconds
# TYPE system_uptime_seconds counter
system_uptime_seconds ${metrics.system.uptime}
`.trim();
  }
}

/**
 * Create default performance monitor configuration
 */
export function createPerformanceMonitor(
  dbManager: DatabaseManager,
  cacheManager: CacheManager
): PerformanceMonitor {
  return new PerformanceMonitor(dbManager, cacheManager, {
    collectInterval: 30000, // 30 seconds
    alertThresholds: {
      database: {
        slowQueryTime: 1000, // 1 second
        errorRate: 5, // 5%
        connectionUsage: 80, // 80%
      },
      cache: {
        minHitRate: 70, // 70%
        maxErrorRate: 2, // 2%
      },
      api: {
        maxResponseTime: 2000, // 2 seconds
        maxErrorRate: 1, // 1%
      },
      system: {
        maxMemoryUsage: 512, // 512MB
        maxCpuUsage: 80, // 80%
      },
    },
  });
}