import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

// In-memory storage for demo purposes (will be replaced with proper database)
const metrics: any[] = [];

// Get all metrics
router.get('/', (req: Request, res: Response) => {
  try {
    const { start, end, service, metric_name } = req.query;
    
    let filteredMetrics = metrics;
    
    // Apply filters
    if (service) {
      filteredMetrics = filteredMetrics.filter(m => m.service === service);
    }
    
    if (metric_name) {
      filteredMetrics = filteredMetrics.filter(m => m.name === metric_name);
    }
    
    if (start || end) {
      const startTime = start ? new Date(start as string).getTime() : 0;
      const endTime = end ? new Date(end as string).getTime() : Date.now();
      
      filteredMetrics = filteredMetrics.filter(m => {
        const metricTime = new Date(m.timestamp).getTime();
        return metricTime >= startTime && metricTime <= endTime;
      });
    }
    
    res.json({
      metrics: filteredMetrics,
      count: filteredMetrics.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Submit metrics
router.post('/', (req: Request, res: Response) => {
  try {
    const { name, value, timestamp, tags, service } = req.body;
    
    if (!name || value === undefined) {
      return res.status(400).json({
        error: 'Missing required fields: name and value'
      });
    }
    
    const metric = {
      id: Date.now().toString(),
      name,
      value: parseFloat(value),
      timestamp: timestamp || new Date().toISOString(),
      tags: tags || {},
      service: service || 'unknown',
      created_at: new Date().toISOString()
    };
    
    metrics.push(metric);
    
    // Keep only last 1000 metrics in memory for demo
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
    
    logger.info(`Metric received: ${name} = ${value} from ${service}`);
    
    res.status(201).json({
      message: 'Metric stored successfully',
      metric_id: metric.id
    });
  } catch (error) {
    logger.error('Error storing metric:', error);
    res.status(500).json({ error: 'Failed to store metric' });
  }
});

// Get metric statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const stats = {
      total_metrics: metrics.length,
      unique_services: new Set(metrics.map(m => m.service)).size,
      unique_metric_names: new Set(metrics.map(m => m.name)).size,
      oldest_metric: metrics.length > 0 ? metrics[0].timestamp : null,
      newest_metric: metrics.length > 0 ? metrics[metrics.length - 1].timestamp : null
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error generating metric stats:', error);
    res.status(500).json({ error: 'Failed to generate statistics' });
  }
});

export { router as metricsRoutes };