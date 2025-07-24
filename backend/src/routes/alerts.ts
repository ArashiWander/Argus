import { Router, Request, Response } from 'express';
import { alertService, CreateAlertRuleData, CreateNotificationChannelData } from '../services/alertService';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

// Alert Rules endpoints

// Get all alert rules
router.get('/rules', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rules = await alertService.getAlertRules();
    res.json({ rules, count: rules.length });
  } catch (error: any) {
    logger.error('Failed to fetch alert rules:', error);
    res.status(500).json({ error: 'Failed to fetch alert rules' });
  }
});

// Get specific alert rule
router.get('/rules/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid rule ID' });
    }

    const rule = await alertService.getAlertRule(id);
    if (!rule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({ rule });
  } catch (error: any) {
    logger.error('Failed to fetch alert rule:', error);
    res.status(500).json({ error: 'Failed to fetch alert rule' });
  }
});

// Create new alert rule
router.post('/rules', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      name,
      description,
      metric_name,
      service,
      condition,
      threshold,
      duration_minutes,
      severity,
      notification_channels,
    } = req.body;

    // Validate required fields
    if (!name || !metric_name || !condition || threshold === undefined || !duration_minutes || !severity) {
      return res.status(400).json({
        error: 'Missing required fields: name, metric_name, condition, threshold, duration_minutes, severity'
      });
    }

    // Validate condition
    const validConditions = ['greater_than', 'less_than', 'equals', 'not_equals'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        error: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
      });
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
      });
    }

    // Validate threshold and duration
    if (typeof threshold !== 'number' || threshold < 0) {
      return res.status(400).json({ error: 'Threshold must be a non-negative number' });
    }

    if (typeof duration_minutes !== 'number' || duration_minutes < 1) {
      return res.status(400).json({ error: 'Duration must be at least 1 minute' });
    }

    const ruleData: CreateAlertRuleData = {
      name,
      description,
      metric_name,
      service,
      condition,
      threshold,
      duration_minutes,
      severity,
      notification_channels: notification_channels || [],
      created_by: req.user!.userId,
    };

    const rule = await alertService.createAlertRule(ruleData);
    res.status(201).json({ rule, message: 'Alert rule created successfully' });
  } catch (error: any) {
    logger.error('Failed to create alert rule:', error);
    res.status(500).json({ error: error.message || 'Failed to create alert rule' });
  }
});

// Update alert rule
router.put('/rules/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid rule ID' });
    }

    const updates = req.body;
    
    // Remove non-updatable fields
    delete updates.id;
    delete updates.created_by;
    delete updates.created_at;

    // Validate fields if they exist
    if (updates.condition) {
      const validConditions = ['greater_than', 'less_than', 'equals', 'not_equals'];
      if (!validConditions.includes(updates.condition)) {
        return res.status(400).json({
          error: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
        });
      }
    }

    if (updates.severity) {
      const validSeverities = ['low', 'medium', 'high', 'critical'];
      if (!validSeverities.includes(updates.severity)) {
        return res.status(400).json({
          error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
        });
      }
    }

    if (updates.threshold !== undefined && (typeof updates.threshold !== 'number' || updates.threshold < 0)) {
      return res.status(400).json({ error: 'Threshold must be a non-negative number' });
    }

    if (updates.duration_minutes !== undefined && (typeof updates.duration_minutes !== 'number' || updates.duration_minutes < 1)) {
      return res.status(400).json({ error: 'Duration must be at least 1 minute' });
    }

    const rule = await alertService.updateAlertRule(id, updates);
    if (!rule) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({ rule, message: 'Alert rule updated successfully' });
  } catch (error: any) {
    logger.error('Failed to update alert rule:', error);
    res.status(500).json({ error: 'Failed to update alert rule' });
  }
});

// Delete alert rule
router.delete('/rules/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid rule ID' });
    }

    const success = await alertService.deleteAlertRule(id);
    if (!success) {
      return res.status(404).json({ error: 'Alert rule not found' });
    }

    res.json({ message: 'Alert rule deleted successfully' });
  } catch (error: any) {
    logger.error('Failed to delete alert rule:', error);
    res.status(500).json({ error: 'Failed to delete alert rule' });
  }
});

// Alert endpoints

// Get all alerts
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, severity } = req.query;
    
    const alerts = await alertService.getAlerts(
      status as string | undefined,
      severity as string | undefined
    );
    
    res.json({ alerts, count: alerts.length });
  } catch (error: any) {
    logger.error('Failed to fetch alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

// Acknowledge alert
router.post('/:id/acknowledge', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }

    const success = await alertService.acknowledgeAlert(id, req.user!.userId);
    if (!success) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert acknowledged successfully' });
  } catch (error: any) {
    logger.error('Failed to acknowledge alert:', error);
    res.status(500).json({ error: 'Failed to acknowledge alert' });
  }
});

// Resolve alert
router.post('/:id/resolve', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid alert ID' });
    }

    const success = await alertService.resolveAlert(id);
    if (!success) {
      return res.status(404).json({ error: 'Alert not found' });
    }

    res.json({ message: 'Alert resolved successfully' });
  } catch (error: any) {
    logger.error('Failed to resolve alert:', error);
    res.status(500).json({ error: 'Failed to resolve alert' });
  }
});

// Notification Channels endpoints

// Get all notification channels
router.get('/channels', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const channels = await alertService.getNotificationChannels();
    res.json({ channels, count: channels.length });
  } catch (error: any) {
    logger.error('Failed to fetch notification channels:', error);
    res.status(500).json({ error: 'Failed to fetch notification channels' });
  }
});

// Create notification channel
router.post('/channels', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, type, config } = req.body;

    // Validate required fields
    if (!name || !type || !config) {
      return res.status(400).json({
        error: 'Missing required fields: name, type, config'
      });
    }

    // Validate type
    const validTypes = ['email', 'webhook', 'slack'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate config based on type
    switch (type) {
      case 'email':
        if (!config.recipients || !Array.isArray(config.recipients) || config.recipients.length === 0) {
          return res.status(400).json({ error: 'Email config must include recipients array' });
        }
        break;
      case 'webhook':
        if (!config.url) {
          return res.status(400).json({ error: 'Webhook config must include url' });
        }
        break;
      case 'slack':
        if (!config.webhook_url) {
          return res.status(400).json({ error: 'Slack config must include webhook_url' });
        }
        break;
    }

    const channelData: CreateNotificationChannelData = {
      name,
      type,
      config,
    };

    const channel = await alertService.createNotificationChannel(channelData);
    res.status(201).json({ channel, message: 'Notification channel created successfully' });
  } catch (error: any) {
    logger.error('Failed to create notification channel:', error);
    res.status(500).json({ error: error.message || 'Failed to create notification channel' });
  }
});

// Trigger alert rule evaluation (manual trigger for testing)
router.post('/evaluate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    await alertService.evaluateAlertRules();
    res.json({ message: 'Alert rule evaluation triggered successfully' });
  } catch (error: any) {
    logger.error('Failed to trigger alert evaluation:', error);
    res.status(500).json({ error: 'Failed to trigger alert evaluation' });
  }
});

// Get alert statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [allAlerts, activeAlerts, rules] = await Promise.all([
      alertService.getAlerts(),
      alertService.getAlerts('active'),
      alertService.getAlertRules(),
    ]);

    const stats = {
      total_alerts: allAlerts.length,
      active_alerts: activeAlerts.length,
      total_rules: rules.length,
      enabled_rules: rules.filter(rule => rule.enabled).length,
      alerts_by_severity: allAlerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      alerts_by_status: allAlerts.reduce((acc, alert) => {
        acc[alert.status] = (acc[alert.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json(stats);
  } catch (error: any) {
    logger.error('Failed to fetch alert statistics:', error);
    res.status(500).json({ error: 'Failed to fetch alert statistics' });
  }
});

export { router as alertRoutes };