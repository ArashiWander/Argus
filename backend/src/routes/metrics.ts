import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';
import { metricsService } from '../services/metricsService';

const router = Router();

// Get all metrics
router.get('/', async (req: Request, res: Response) => {
  try {
    const { start, end, service, metric_name } = req.query;
    
    const query = {
      start: start as string,
      end: end as string,
      service: service as string,
      metric_name: metric_name as string,
    };
    
    const { metrics, count } = await metricsService.getMetrics(query);
    
    res.json({
      metrics,
      count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Submit metrics
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, value, timestamp, tags, service } = req.body;
    
    if (!name || value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: name and value'
      });
    }
    
    const metricData = {
      name,
      value: parseFloat(value),
      timestamp: timestamp || new Date().toISOString(),
      tags: tags || {},
      service: service || 'unknown',
    };
    
    const metricId = await metricsService.storeMetric(metricData);
    
    res.status(201).json({
      message: 'Metric stored successfully',
      metric_id: metricId
    });
  } catch (error) {
    logger.error('Error storing metric:', error);
    res.status(500).json({ error: 'Failed to store metric' });
  }
});

// Get metric statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await metricsService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error generating metric stats:', error);
    res.status(500).json({ error: 'Failed to generate statistics' });
  }
});

export { router as metricsRoutes };