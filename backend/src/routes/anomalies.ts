import { Router, Request, Response } from 'express';
import { anomalyDetectionService, AnomalyDetectionConfig } from '../services/anomalyDetectionService';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

// Detection Configurations

// Get all anomaly detection configurations
router.get('/configs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const configs = await anomalyDetectionService.getDetectionConfigs();
    res.json({ configs, count: configs.length });
  } catch (error: any) {
    logger.error('Failed to fetch anomaly detection configs:', error);
    res.status(500).json({ error: 'Failed to fetch anomaly detection configs' });
  }
});

// Create new anomaly detection configuration
router.post('/configs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      metric_name,
      service,
      algorithm,
      sensitivity,
      window_minutes,
      enabled = true,
    } = req.body;

    // Validate required fields
    if (!metric_name || !algorithm || sensitivity === undefined || !window_minutes) {
      return res.status(400).json({
        error: 'Missing required fields: metric_name, algorithm, sensitivity, window_minutes'
      });
    }

    // Validate algorithm
    const validAlgorithms = ['zscore', 'iqr', 'moving_average', 'seasonal'];
    if (!validAlgorithms.includes(algorithm)) {
      return res.status(400).json({
        error: `Invalid algorithm. Must be one of: ${validAlgorithms.join(', ')}`
      });
    }

    // Validate sensitivity
    if (typeof sensitivity !== 'number' || sensitivity < 1 || sensitivity > 10) {
      return res.status(400).json({ error: 'Sensitivity must be a number between 1 and 10' });
    }

    // Validate window_minutes
    if (typeof window_minutes !== 'number' || window_minutes < 5) {
      return res.status(400).json({ error: 'Window minutes must be at least 5' });
    }

    const configData: Omit<AnomalyDetectionConfig, 'created_at'> = {
      metric_name,
      service,
      algorithm,
      sensitivity,
      window_minutes,
      enabled,
    };

    const config = await anomalyDetectionService.createDetectionConfig(configData);
    res.status(201).json({ config, message: 'Anomaly detection config created successfully' });
  } catch (error: any) {
    logger.error('Failed to create anomaly detection config:', error);
    res.status(500).json({ error: error.message || 'Failed to create anomaly detection config' });
  }
});

// Update anomaly detection configuration
router.put('/configs/:metric_name', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { metric_name } = req.params;
    const { service } = req.query;
    const updates = req.body;

    // Remove non-updatable fields
    delete updates.metric_name;
    delete updates.created_at;

    // Validate fields if they exist
    if (updates.algorithm) {
      const validAlgorithms = ['zscore', 'iqr', 'moving_average', 'seasonal'];
      if (!validAlgorithms.includes(updates.algorithm)) {
        return res.status(400).json({
          error: `Invalid algorithm. Must be one of: ${validAlgorithms.join(', ')}`
        });
      }
    }

    if (updates.sensitivity !== undefined && (typeof updates.sensitivity !== 'number' || updates.sensitivity < 1 || updates.sensitivity > 10)) {
      return res.status(400).json({ error: 'Sensitivity must be a number between 1 and 10' });
    }

    if (updates.window_minutes !== undefined && (typeof updates.window_minutes !== 'number' || updates.window_minutes < 5)) {
      return res.status(400).json({ error: 'Window minutes must be at least 5' });
    }

    const config = await anomalyDetectionService.updateDetectionConfig(
      metric_name,
      service as string,
      updates
    );
    
    if (!config) {
      return res.status(404).json({ error: 'Anomaly detection config not found' });
    }

    res.json({ config, message: 'Anomaly detection config updated successfully' });
  } catch (error: any) {
    logger.error('Failed to update anomaly detection config:', error);
    res.status(500).json({ error: 'Failed to update anomaly detection config' });
  }
});

// Delete anomaly detection configuration
router.delete('/configs/:metric_name', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { metric_name } = req.params;
    const { service } = req.query;

    const success = await anomalyDetectionService.deleteDetectionConfig(
      metric_name,
      service as string
    );
    
    if (!success) {
      return res.status(404).json({ error: 'Anomaly detection config not found' });
    }

    res.json({ message: 'Anomaly detection config deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete anomaly detection config:', error);
    res.status(500).json({ error: 'Failed to delete anomaly detection config' });
  }
});

// Anomaly Detection and Results

// Trigger anomaly detection manually
router.post('/detect', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const anomalies = await anomalyDetectionService.detectAnomalies();
    res.json({ 
      anomalies, 
      count: anomalies.length,
      message: 'Anomaly detection completed successfully' 
    });
  } catch (error: any) {
    logger.error('Failed to run anomaly detection:', error);
    res.status(500).json({ error: 'Failed to run anomaly detection' });
  }
});

// Get detected anomalies with optional filtering
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      service, 
      metric_name, 
      severity, 
      start, 
      end, 
      limit 
    } = req.query;

    const anomalies = await anomalyDetectionService.getAnomalies(
      service as string,
      metric_name as string,
      severity as string,
      start as string,
      end as string,
      parseInt(limit as string) || 100
    );

    res.json({ anomalies, count: anomalies.length });
  } catch (error: any) {
    logger.error('Failed to fetch anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

// Get anomaly statistics
router.get('/stats', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await anomalyDetectionService.getAnomalyStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Failed to fetch anomaly statistics:', error);
    res.status(500).json({ error: 'Failed to fetch anomaly statistics' });
  }
});

export { router as anomalyRoutes };