import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

// Health check endpoint
router.get('/', (req: Request, res: Response) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      api: 'healthy',
      database: 'not_connected', // Will be updated when databases are integrated
      cache: 'not_connected'
    }
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = 'Error occurred';
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

export { router as healthRoutes };