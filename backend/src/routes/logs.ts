import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';
import { logsService } from '../services/logsService';

const router = Router();

// Get logs with filtering and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      level, 
      service, 
      start, 
      end, 
      search, 
      page = 1, 
      limit = 100 
    } = req.query;
    
    const query = {
      level: level as string,
      service: service as string,
      start: start as string,
      end: end as string,
      search: search as string,
      page: parseInt(page as string, 10),
      limit: parseInt(limit as string, 10),
    };
    
    const result = await logsService.getLogs(query);
    
    res.json({
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Submit logs
router.post('/', async (req: Request, res: Response) => {
  try {
    const { level, message, service, timestamp, tags } = req.body;
    
    if (!level || !message) {
      return res.status(400).json({
        error: 'Missing required fields: level and message'
      });
    }
    
    const logData = {
      level,
      message,
      service: service || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
      tags: tags || {},
    };
    
    const logId = await logsService.storeLog(logData);
    
    res.status(201).json({
      message: 'Log stored successfully',
      log_id: logId
    });
  } catch (error) {
    logger.error('Error storing log:', error);
    res.status(500).json({ error: 'Failed to store log' });
  }
});

// Submit bulk logs
router.post('/bulk', async (req: Request, res: Response) => {
  try {
    const { logs: bulkLogs } = req.body;
    
    if (!Array.isArray(bulkLogs)) {
      return res.status(400).json({
        error: 'logs must be an array'
      });
    }
    
    const logsData = bulkLogs.map(log => ({
      level: log.level,
      message: log.message,
      service: log.service || 'unknown',
      timestamp: log.timestamp || new Date().toISOString(),
      tags: log.tags || {},
    }));
    
    const count = await logsService.storeBulkLogs(logsData);
    
    res.status(201).json({
      message: 'Bulk logs stored successfully',
      count
    });
  } catch (error) {
    logger.error('Error storing bulk logs:', error);
    res.status(500).json({ error: 'Failed to store bulk logs' });
  }
});

// Get log statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await logsService.getStats();
    res.json(stats);
  } catch (error) {
    logger.error('Error generating log stats:', error);
    res.status(500).json({ error: 'Failed to generate statistics' });
  }
});

export { router as logsRoutes };