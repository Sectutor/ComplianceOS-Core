/**
 * Enterprise Server Entry Point with Scalability Features
 * 
 * This server configuration includes:
 * - Database connection pooling with monitoring
 * - Redis caching layer
 * - Performance monitoring and alerting
 * - Health check endpoints
 * - Graceful shutdown handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './src/server/routers';
import { createContext } from './src/server/context';
import { initializeDatabase, shutdownDatabase, healthCheck } from './src/db-enhanced';
import { createPerformanceMonitor } from './src/lib/performance/monitor';
import { DatabaseManager } from './src/lib/database/config';
import { CacheManager } from './src/lib/cache/manager';

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Initialize infrastructure components
let dbManager: DatabaseManager | null = null;
let cacheManager: CacheManager | null = null;
let performanceMonitor: ReturnType<typeof createPerformanceMonitor> | null = null;

/**
 * Initialize server infrastructure
 */
async function initializeInfrastructure(): Promise<void> {
  console.log('[SERVER] Initializing enterprise infrastructure...');

  try {
    // Initialize database and cache
    await initializeDatabase();
    
    // Get manager instances
    const { getDbManager, getCacheManager } = await import('./src/db-enhanced');
    dbManager = getDbManager();
    cacheManager = getCacheManager();

    // Initialize performance monitoring
    performanceMonitor = createPerformanceMonitor(dbManager, cacheManager);
    performanceMonitor.start();

    console.log('[SERVER] Enterprise infrastructure initialized successfully');
  } catch (error) {
    console.error('[SERVER] Failed to initialize infrastructure:', error);
    process.exit(1);
  }
}

/**
 * Configure Express middleware
 */
function configureMiddleware(): void {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.supabase.io"],
      },
    },
  }));

  // CORS configuration
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }));

  // Rate limiting
  const rateLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: 60,
        timestamp: new Date().toISOString(),
      });
    },
  });

  app.use('/api', rateLimiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
      
      // Record API performance
      if (performanceMonitor && req.path.startsWith('/api/trpc')) {
        performanceMonitor.recordApiRequest(
          req.path,
          duration,
          res.statusCode < 400
        );
      }
    });

    next();
  });
}

/**
 * Configure health check endpoints
 */
function configureHealthChecks(): void {
  // Basic health check
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: NODE_ENV,
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  // Detailed health check with database and cache status
  app.get('/health/detailed', async (req, res) => {
    try {
      const health = await healthCheck();
      
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        ...health,
      });
    } catch (error) {
      console.error('[HEALTH] Detailed health check failed:', error);
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Service unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Readiness check (for Kubernetes)
  app.get('/ready', async (req, res) => {
    try {
      if (!dbManager || !cacheManager) {
        return res.status(503).json({
          status: 'not_ready',
          timestamp: new Date().toISOString(),
          error: 'Infrastructure not initialized',
        });
      }

      const health = await healthCheck();
      const isReady = health.database.primary && health.cache.healthy;

      res.status(isReady ? 200 : 503).json({
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date().toISOString(),
        ...health,
      });
    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Liveness check (for Kubernetes)
  app.get('/live', (req, res) => {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });
}

/**
 * Configure metrics endpoint
 */
function configureMetrics(): void {
  app.get('/metrics', async (req, res) => {
    try {
      if (!performanceMonitor) {
        return res.status(503).json({ error: 'Performance monitoring not available' });
      }

      const prometheusMetrics = performanceMonitor.exportPrometheusMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(prometheusMetrics);
    } catch (error) {
      console.error('[METRICS] Failed to export metrics:', error);
      res.status(500).json({ error: 'Failed to export metrics' });
    }
  });
}

/**
 * Configure tRPC routes
 */
function configureTRPC(): void {
  app.use('/api/trpc', createExpressMiddleware({
    router: appRouter,
    createContext,
    onError: ({ path, error }) => {
      console.error(`[TRPC] Error on ${path}:`, error);
    },
  }));
}

/**
 * Configure graceful shutdown
 */
function configureGracefulShutdown(): void {
  const shutdown = async (signal: string) => {
    console.log(`[SERVER] Received ${signal}, starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(() => {
      console.log('[SERVER] HTTP server closed');
    });

    try {
      // Shutdown infrastructure components
      if (performanceMonitor) {
        performanceMonitor.stop();
        console.log('[SERVER] Performance monitoring stopped');
      }

      await shutdownDatabase();
      console.log('[SERVER] Database connections closed');

      console.log('[SERVER] Graceful shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('[SERVER] Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('[SERVER] Uncaught exception:', error);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[SERVER] Unhandled rejection at:', promise, 'reason:', reason);
    shutdown('unhandledRejection');
  });
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Initialize infrastructure
    await initializeInfrastructure();

    // Configure Express app
    configureMiddleware();
    configureHealthChecks();
    configureMetrics();
    configureTRPC();
    configureGracefulShutdown();

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`[SERVER] 🚀 Enterprise server running on port ${PORT}`);
      console.log(`[SERVER] Environment: ${NODE_ENV}`);
      console.log(`[SERVER] Health check: http://localhost:${PORT}/health`);
      console.log(`[SERVER] Metrics: http://localhost:${PORT}/metrics`);
      console.log(`[SERVER] Ready to handle enterprise-scale traffic`);
    });

    return server;
  } catch (error) {
    console.error('[SERVER] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    console.error('[SERVER] Fatal error:', error);
    process.exit(1);
  });
}

export { app, startServer };