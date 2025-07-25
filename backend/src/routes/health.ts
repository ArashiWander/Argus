import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';
import { checkDatabaseHealth } from '../config/database';
import { protocolManager } from '../protocols/protocolManager';

const router = Router();

// Health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    const dbHealth = await checkDatabaseHealth();
    const protocolHealth = await protocolManager.healthCheck();
    
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        api: 'healthy',
        database: dbHealth.postgres,
        cache: dbHealth.redis,
        influxdb: dbHealth.influx,
        elasticsearch: dbHealth.elasticsearch,
      },
      protocols: protocolHealth.protocols
    };

    res.status(200).json(healthCheck);
  } catch (error) {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'Error occurred',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      services: {
        api: 'error',
        database: 'error',
        cache: 'error',
        influxdb: 'error',
        elasticsearch: 'error',
      }
    };
    
    logger.error('Health check failed:', error);
    res.status(503).json(healthCheck);
  }
});

// Readiness probe
router.get('/ready', (req: Request, res: Response) => {
  // Check if all required services are available
  const isReady = true; // Will implement actual checks later
  
  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString()
    });
  }
});

// Liveness probe
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

// Protocol status endpoint
router.get('/protocols', async (req: Request, res: Response) => {
  try {
    const protocolStatus = protocolManager.getProtocolStatus();
    const protocolHealth = await protocolManager.healthCheck();
    const enabledProtocols = protocolManager.getEnabledProtocols();
    const performanceMetrics = protocolManager.getPerformanceMetrics();

    res.status(200).json({
      timestamp: new Date().toISOString(),
      enabled_protocols: enabledProtocols,
      total_protocols: Object.keys(protocolStatus).length,
      enabled_count: enabledProtocols.length,
      status: protocolStatus,
      health: protocolHealth.protocols,
      performance: performanceMetrics
    });
  } catch (error) {
    logger.error('Protocol status check failed:', error);
    res.status(503).json({
      error: 'Failed to retrieve protocol status',
      timestamp: new Date().toISOString()
    });
  }
});

export { router as healthRoutes };