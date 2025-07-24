import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';

const router = Router();

// In-memory storage for demo purposes (will be replaced with Elasticsearch)
const logs: any[] = [];

// Get logs with filtering and pagination
router.get('/', (req: Request, res: Response) => {
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
    
    let filteredLogs = logs;
    
    // Apply filters
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    if (service) {
      filteredLogs = filteredLogs.filter(log => log.service === service);
    }
    
    if (search) {
      const searchTerm = (search as string).toLowerCase();
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm) ||
        (log.tags && JSON.stringify(log.tags).toLowerCase().includes(searchTerm))
      );
    }
    
    if (start || end) {
      const startTime = start ? new Date(start as string).getTime() : 0;
      const endTime = end ? new Date(end as string).getTime() : Date.now();
      
      filteredLogs = filteredLogs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime >= startTime && logTime <= endTime;
      });
    }
    
    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Pagination
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
    
    res.json({
      logs: paginatedLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredLogs.length,
        pages: Math.ceil(filteredLogs.length / limitNum)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Submit logs
router.post('/', (req: Request, res: Response) => {
  try {
    const { level, message, service, timestamp, tags } = req.body;
    
    if (!level || !message) {
      return res.status(400).json({
        error: 'Missing required fields: level and message'
      });
    }
    
    const logEntry = {
      id: Date.now().toString(),
      level,
      message,
      service: service || 'unknown',
      timestamp: timestamp || new Date().toISOString(),
      tags: tags || {},
      created_at: new Date().toISOString()
    };
    
    logs.push(logEntry);
    
    // Keep only last 10000 logs in memory for demo
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }
    
    logger.info(`Log received: [${level}] ${message} from ${service}`);
    
    res.status(201).json({
      message: 'Log stored successfully',
      log_id: logEntry.id
    });
  } catch (error) {
    logger.error('Error storing log:', error);
    res.status(500).json({ error: 'Failed to store log' });
  }
});

// Submit bulk logs
router.post('/bulk', (req: Request, res: Response) => {
  try {
    const { logs: bulkLogs } = req.body;
    
    if (!Array.isArray(bulkLogs)) {
      return res.status(400).json({
        error: 'logs must be an array'
      });
    }
    
    const processedLogs = bulkLogs.map(log => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      level: log.level,
      message: log.message,
      service: log.service || 'unknown',
      timestamp: log.timestamp || new Date().toISOString(),
      tags: log.tags || {},
      created_at: new Date().toISOString()
    }));
    
    logs.push(...processedLogs);
    
    // Keep only last 10000 logs in memory for demo
    if (logs.length > 10000) {
      logs.splice(0, logs.length - 10000);
    }
    
    logger.info(`Bulk logs received: ${processedLogs.length} logs`);
    
    res.status(201).json({
      message: 'Bulk logs stored successfully',
      count: processedLogs.length
    });
  } catch (error) {
    logger.error('Error storing bulk logs:', error);
    res.status(500).json({ error: 'Failed to store bulk logs' });
  }
});

// Get log statistics
router.get('/stats', (req: Request, res: Response) => {
  try {
    const levelCounts = logs.reduce((acc: any, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    }, {});
    
    const stats = {
      total_logs: logs.length,
      unique_services: new Set(logs.map(log => log.service)).size,
      level_distribution: levelCounts,
      oldest_log: logs.length > 0 ? logs[0].timestamp : null,
      newest_log: logs.length > 0 ? logs[logs.length - 1].timestamp : null
    };
    
    res.json(stats);
  } catch (error) {
    logger.error('Error generating log stats:', error);
    res.status(500).json({ error: 'Failed to generate statistics' });
  }
});

export { router as logsRoutes };