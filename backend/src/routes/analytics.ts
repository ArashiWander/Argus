import { Router, Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

// Anomaly Detection endpoints

// Trigger anomaly detection for a specific metric
router.post('/anomalies/detect', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { metric_name, service, lookback_hours } = req.body;

    if (!metric_name) {
      return res.status(400).json({ error: 'metric_name is required' });
    }

    const lookbackHours = lookback_hours || 24;
    if (lookbackHours < 1 || lookbackHours > 168) { // Max 7 days
      return res.status(400).json({ error: 'lookback_hours must be between 1 and 168' });
    }

    const anomalies = await analyticsService.detectAnomalies(metric_name, service, lookbackHours);
    
    res.json({
      anomalies,
      count: anomalies.length,
      metric_name,
      service: service || 'all',
      lookback_hours: lookbackHours,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to detect anomalies:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// Get historical anomalies
router.get('/anomalies', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, severity } = req.query;

    const anomalies = await analyticsService.getAnomalies(
      status as string | undefined,
      severity as string | undefined
    );

    res.json({
      anomalies,
      count: anomalies.length,
      filters: { status, severity },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to fetch anomalies:', error);
    res.status(500).json({ error: 'Failed to fetch anomalies' });
  }
});

// Predictive Analytics endpoints

// Generate predictive analysis for a metric
router.post('/predictions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { metric_name, service, horizon_hours } = req.body;

    if (!metric_name) {
      return res.status(400).json({ error: 'metric_name is required' });
    }

    const horizonHours = horizon_hours || 24;
    if (horizonHours < 1 || horizonHours > 168) { // Max 7 days ahead
      return res.status(400).json({ error: 'horizon_hours must be between 1 and 168' });
    }

    const prediction = await analyticsService.generatePredictiveAnalysis(metric_name, service, horizonHours);
    
    if (!prediction) {
      return res.status(400).json({ 
        error: 'Insufficient data for prediction. Need at least 20 historical data points.' 
      });
    }

    res.json({
      prediction,
      message: 'Predictive analysis generated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to generate prediction:', error);
    res.status(500).json({ error: 'Failed to generate prediction' });
  }
});

// Performance Insights endpoints

// Generate performance insights
router.post('/insights/generate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const insights = await analyticsService.generatePerformanceInsights();
    
    res.json({
      insights,
      count: insights.length,
      message: 'Performance insights generated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to generate insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// Get performance insights
router.get('/insights', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { type } = req.query;

    const insights = await analyticsService.getPerformanceInsights(type as string | undefined);

    const stats = {
      total: insights.length,
      by_type: insights.reduce((acc, insight) => {
        acc[insight.type] = (acc[insight.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_severity: insights.reduce((acc, insight) => {
        acc[insight.severity] = (acc[insight.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      insights,
      stats,
      filters: { type },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to fetch insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Capacity Planning endpoints

// Generate capacity planning report
router.post('/capacity-planning', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { service, resource_type } = req.body;

    if (!service || !resource_type) {
      return res.status(400).json({ error: 'service and resource_type are required' });
    }

    const validResourceTypes = ['cpu', 'memory', 'disk', 'network'];
    if (!validResourceTypes.includes(resource_type)) {
      return res.status(400).json({
        error: `Invalid resource_type. Must be one of: ${validResourceTypes.join(', ')}`
      });
    }

    const capacityPlan = await analyticsService.generateCapacityPlan(service, resource_type);

    if (!capacityPlan) {
      return res.status(400).json({
        error: 'Insufficient data for capacity planning. Need at least 30 historical data points.'
      });
    }

    res.json({
      capacity_plan: capacityPlan,
      message: 'Capacity planning analysis completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to generate capacity plan:', error);
    res.status(500).json({ error: 'Failed to generate capacity plan' });
  }
});

// Analytics dashboard data
router.get('/dashboard', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [anomalies, insights] = await Promise.all([
      analyticsService.getAnomalies('active'),
      analyticsService.getPerformanceInsights(),
    ]);

    const dashboardData = {
      summary: {
        active_anomalies: anomalies.length,
        critical_anomalies: anomalies.filter(a => a.severity === 'critical').length,
        total_insights: insights.length,
        critical_insights: insights.filter(i => i.severity === 'critical').length,
      },
      recent_anomalies: anomalies.slice(0, 10),
      recent_insights: insights.slice(0, 10),
      anomaly_trends: {
        by_severity: anomalies.reduce((acc, anomaly) => {
          acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      insight_trends: {
        by_type: insights.reduce((acc, insight) => {
          acc[insight.type] = (acc[insight.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_severity: insights.reduce((acc, insight) => {
          acc[insight.severity] = (acc[insight.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(dashboardData);
  } catch (error: any) {
    logger.error('Failed to fetch analytics dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch analytics dashboard data' });
  }
});

// Batch analytics operations
router.post('/batch/analyze', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { services, metric_names } = req.body;

    if (!services || !Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'services array is required and must not be empty' });
    }

    if (!metric_names || !Array.isArray(metric_names) || metric_names.length === 0) {
      return res.status(400).json({ error: 'metric_names array is required and must not be empty' });
    }

    const results = {
      anomalies: [] as any[],
      insights: [] as any[],
      predictions: [] as any[],
      capacity_plans: [] as any[],
    };

    // Process each service and metric combination
    for (const service of services) {
      for (const metricName of metric_names) {
        try {
          // Detect anomalies
          const anomalies = await analyticsService.detectAnomalies(metricName, service, 24);
          results.anomalies.push(...anomalies);

          // Generate predictions
          const prediction = await analyticsService.generatePredictiveAnalysis(metricName, service, 24);
          if (prediction) {
            results.predictions.push(prediction);
          }

          // Generate capacity plans for resource metrics
          if (['cpu.usage', 'memory.usage', 'disk.usage', 'network.usage'].includes(metricName)) {
            const resourceType = metricName.split('.')[0];
            const capacityPlan = await analyticsService.generateCapacityPlan(service, resourceType);
            if (capacityPlan) {
              results.capacity_plans.push(capacityPlan);
            }
          }
        } catch (error) {
          logger.warn(`Failed to analyze ${service}:${metricName}:`, error);
        }
      }
    }

    // Generate general insights
    const generalInsights = await analyticsService.generatePerformanceInsights();
    results.insights.push(...generalInsights);

    const summary = {
      services_analyzed: services.length,
      metrics_analyzed: metric_names.length,
      anomalies_found: results.anomalies.length,
      predictions_generated: results.predictions.length,
      insights_generated: results.insights.length,
      capacity_plans_created: results.capacity_plans.length,
    };

    res.json({
      results,
      summary,
      message: 'Batch analysis completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to perform batch analysis:', error);
    res.status(500).json({ error: 'Failed to perform batch analysis' });
  }
});

// Analytics statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [allAnomalies, allInsights] = await Promise.all([
      analyticsService.getAnomalies(),
      analyticsService.getPerformanceInsights(),
    ]);

    const stats = {
      anomalies: {
        total: allAnomalies.length,
        active: allAnomalies.filter(a => a.status === 'active').length,
        by_severity: allAnomalies.reduce((acc, anomaly) => {
          acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_metric: allAnomalies.reduce((acc, anomaly) => {
          acc[anomaly.metric_name] = (acc[anomaly.metric_name] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      insights: {
        total: allInsights.length,
        by_type: allInsights.reduce((acc, insight) => {
          acc[insight.type] = (acc[insight.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_severity: allInsights.reduce((acc, insight) => {
          acc[insight.severity] = (acc[insight.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        average_confidence: allInsights.reduce((sum, insight) => sum + insight.confidence_score, 0) / allInsights.length || 0,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error: any) {
    logger.error('Failed to fetch analytics statistics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics statistics' });
  }
});

export { router as analyticsRoutes };