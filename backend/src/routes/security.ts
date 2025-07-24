import { Router, Request, Response } from 'express';
import { securityService } from '../services/securityService';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

// Security Events endpoints

// Log a security event
router.post('/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      event_type,
      severity,
      source_ip,
      user_id,
      username,
      resource,
      action,
      outcome,
      timestamp,
      details,
    } = req.body;

    // Validate required fields
    if (!event_type || !action || !outcome) {
      return res.status(400).json({
        error: 'Missing required fields: event_type, action, outcome'
      });
    }

    // Validate event_type
    const validEventTypes = ['authentication', 'authorization', 'data_access', 'system_change', 'network_intrusion', 'malware_detection'];
    if (!validEventTypes.includes(event_type)) {
      return res.status(400).json({
        error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}`
      });
    }

    // Validate outcome
    const validOutcomes = ['success', 'failure', 'blocked'];
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({
        error: `Invalid outcome. Must be one of: ${validOutcomes.join(', ')}`
      });
    }

    // Validate severity
    const validSeverities = ['info', 'low', 'medium', 'high', 'critical'];
    const eventSeverity = severity || 'medium';
    if (!validSeverities.includes(eventSeverity)) {
      return res.status(400).json({
        error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}`
      });
    }

    const securityEvent = await securityService.logSecurityEvent({
      event_type,
      severity: eventSeverity,
      source_ip,
      user_id,
      username,
      resource,
      action,
      outcome,
      timestamp: timestamp || new Date().toISOString(),
      details: details || {},
    });

    res.status(201).json({
      security_event: securityEvent,
      message: 'Security event logged successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to log security event:', error);
    res.status(500).json({ error: 'Failed to log security event' });
  }
});

// Get security events
router.get('/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { event_type, outcome, start_date, end_date } = req.query;

    const events = await securityService.getSecurityEvents(
      event_type as string | undefined,
      outcome as string | undefined,
      start_date as string | undefined,
      end_date as string | undefined
    );

    const stats = {
      total: events.length,
      by_type: events.reduce((acc, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_outcome: events.reduce((acc, event) => {
        acc[event.outcome] = (acc[event.outcome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_severity: events.reduce((acc, event) => {
        acc[event.severity] = (acc[event.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      events,
      stats,
      filters: { event_type, outcome, start_date, end_date },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to fetch security events:', error);
    res.status(500).json({ error: 'Failed to fetch security events' });
  }
});

// Security Alerts endpoints

// Get security alerts
router.get('/alerts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status } = req.query;

    const alerts = await securityService.getSecurityAlerts(status as string | undefined);

    const stats = {
      total: alerts.length,
      active: alerts.filter(a => a.status === 'active').length,
      by_severity: alerts.reduce((acc, alert) => {
        acc[alert.severity] = (acc[alert.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_threat_type: alerts.reduce((acc, alert) => {
        acc[alert.threat_type] = (acc[alert.threat_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      alerts,
      stats,
      filters: { status },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to fetch security alerts:', error);
    res.status(500).json({ error: 'Failed to fetch security alerts' });
  }
});

// Trigger threat detection evaluation
router.post('/threats/evaluate', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const alerts = await securityService.evaluateThreatDetectionRules();

    res.json({
      alerts,
      count: alerts.length,
      message: 'Threat detection evaluation completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to evaluate threats:', error);
    res.status(500).json({ error: 'Failed to evaluate threats' });
  }
});

// Get threat detection rules
router.get('/threats/rules', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const rules = await securityService.getThreatDetectionRules();

    res.json({
      rules,
      count: rules.length,
      enabled_count: rules.filter(r => r.enabled).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to fetch threat detection rules:', error);
    res.status(500).json({ error: 'Failed to fetch threat detection rules' });
  }
});

// Audit Trail endpoints

// Log audit trail
router.post('/audit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      user_id,
      username,
      action,
      resource,
      resource_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
      outcome,
      details,
    } = req.body;

    // Validate required fields
    if (!action || !resource || !outcome) {
      return res.status(400).json({
        error: 'Missing required fields: action, resource, outcome'
      });
    }

    // Validate outcome
    const validOutcomes = ['success', 'failure'];
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({
        error: `Invalid outcome. Must be one of: ${validOutcomes.join(', ')}`
      });
    }

    const auditEntry = await securityService.logAuditTrail({
      user_id,
      username,
      action,
      resource,
      resource_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
      outcome,
      details,
    });

    res.status(201).json({
      audit_entry: auditEntry,
      message: 'Audit trail logged successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to log audit trail:', error);
    res.status(500).json({ error: 'Failed to log audit trail' });
  }
});

// Get audit trails
router.get('/audit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { user_id, action, resource, start_date, end_date } = req.query;

    const auditTrails = await securityService.getAuditTrails(
      user_id ? parseInt(user_id as string) : undefined,
      action as string | undefined,
      resource as string | undefined,
      start_date as string | undefined,
      end_date as string | undefined
    );

    const stats = {
      total: auditTrails.length,
      by_action: auditTrails.reduce((acc, trail) => {
        acc[trail.action] = (acc[trail.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_resource: auditTrails.reduce((acc, trail) => {
        acc[trail.resource] = (acc[trail.resource] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_outcome: auditTrails.reduce((acc, trail) => {
        acc[trail.outcome] = (acc[trail.outcome] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    res.json({
      audit_trails: auditTrails,
      stats,
      filters: { user_id, action, resource, start_date, end_date },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to fetch audit trails:', error);
    res.status(500).json({ error: 'Failed to fetch audit trails' });
  }
});

// Compliance endpoints

// Generate compliance report
router.post('/compliance/report', authenticateToken, requireRole('admin'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { framework, start_date, end_date } = req.body;

    // Validate required fields
    if (!framework || !start_date || !end_date) {
      return res.status(400).json({
        error: 'Missing required fields: framework, start_date, end_date'
      });
    }

    // Validate framework
    const validFrameworks = ['SOX', 'GDPR', 'HIPAA', 'PCI_DSS', 'SOC2', 'ISO27001'];
    if (!validFrameworks.includes(framework)) {
      return res.status(400).json({
        error: `Invalid framework. Must be one of: ${validFrameworks.join(', ')}`
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use ISO 8601 format.' });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ error: 'start_date must be before end_date' });
    }

    const report = await securityService.generateComplianceReport(framework, start_date, end_date);

    res.json({
      compliance_report: report,
      message: 'Compliance report generated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to generate compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

// Security Dashboard
router.get('/dashboard', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

    const [securityEvents, securityAlerts, auditTrails] = await Promise.all([
      securityService.getSecurityEvents(undefined, undefined, startTime.toISOString(), endTime.toISOString()),
      securityService.getSecurityAlerts('active'),
      securityService.getAuditTrails(undefined, undefined, undefined, startTime.toISOString(), endTime.toISOString()),
    ]);

    const dashboardData = {
      summary: {
        security_events_24h: securityEvents.length,
        active_alerts: securityAlerts.length,
        critical_alerts: securityAlerts.filter(a => a.severity === 'critical').length,
        audit_entries_24h: auditTrails.length,
        failed_events_24h: securityEvents.filter(e => e.outcome === 'failure').length,
      },
      recent_events: securityEvents.slice(0, 10),
      active_alerts: securityAlerts.slice(0, 10),
      recent_audit_trails: auditTrails.slice(0, 10),
      event_trends: {
        by_type: securityEvents.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_severity: securityEvents.reduce((acc, event) => {
          acc[event.severity] = (acc[event.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        by_outcome: securityEvents.reduce((acc, event) => {
          acc[event.outcome] = (acc[event.outcome] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      threat_landscape: {
        by_threat_type: securityAlerts.reduce((acc, alert) => {
          acc[alert.threat_type] = (acc[alert.threat_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        risk_distribution: securityAlerts.reduce((acc, alert) => {
          const riskLevel = alert.risk_score >= 80 ? 'high' : alert.risk_score >= 50 ? 'medium' : 'low';
          acc[riskLevel] = (acc[riskLevel] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(dashboardData);
  } catch (error: any) {
    logger.error('Failed to fetch security dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch security dashboard data' });
  }
});

// Security statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period } = req.query;
    
    const periodHours = period === 'week' ? 168 : period === 'month' ? 720 : 24;
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - periodHours * 60 * 60 * 1000);

    const [securityEvents, securityAlerts, auditTrails, threatRules] = await Promise.all([
      securityService.getSecurityEvents(undefined, undefined, startTime.toISOString(), endTime.toISOString()),
      securityService.getSecurityAlerts(),
      securityService.getAuditTrails(undefined, undefined, undefined, startTime.toISOString(), endTime.toISOString()),
      securityService.getThreatDetectionRules(),
    ]);

    const stats = {
      period: `${periodHours} hours`,
      security_events: {
        total: securityEvents.length,
        success: securityEvents.filter(e => e.outcome === 'success').length,
        failure: securityEvents.filter(e => e.outcome === 'failure').length,
        blocked: securityEvents.filter(e => e.outcome === 'blocked').length,
        by_type: securityEvents.reduce((acc, event) => {
          acc[event.event_type] = (acc[event.event_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        average_risk_score: securityEvents.reduce((sum, event) => sum + event.risk_score, 0) / securityEvents.length || 0,
      },
      security_alerts: {
        total: securityAlerts.length,
        active: securityAlerts.filter(a => a.status === 'active').length,
        resolved: securityAlerts.filter(a => a.status === 'resolved').length,
        false_positives: securityAlerts.filter(a => a.status === 'false_positive').length,
        by_severity: securityAlerts.reduce((acc, alert) => {
          acc[alert.severity] = (acc[alert.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        average_risk_score: securityAlerts.reduce((sum, alert) => sum + alert.risk_score, 0) / securityAlerts.length || 0,
      },
      audit_trails: {
        total: auditTrails.length,
        success: auditTrails.filter(t => t.outcome === 'success').length,
        failure: auditTrails.filter(t => t.outcome === 'failure').length,
        unique_users: new Set(auditTrails.map(t => t.user_id).filter(Boolean)).size,
        by_action: auditTrails.reduce((acc, trail) => {
          acc[trail.action] = (acc[trail.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      threat_detection: {
        total_rules: threatRules.length,
        enabled_rules: threatRules.filter(r => r.enabled).length,
        by_type: threatRules.reduce((acc, rule) => {
          acc[rule.rule_type] = (acc[rule.rule_type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      },
      timestamp: new Date().toISOString(),
    };

    res.json(stats);
  } catch (error: any) {
    logger.error('Failed to fetch security statistics:', error);
    res.status(500).json({ error: 'Failed to fetch security statistics' });
  }
});

// Batch security operations
router.post('/batch/events', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'events array is required and must not be empty' });
    }

    if (events.length > 100) {
      return res.status(400).json({ error: 'Maximum 100 events per batch' });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < events.length; i++) {
      try {
        const event = events[i];
        
        // Validate required fields
        if (!event.event_type || !event.action || !event.outcome) {
          errors.push({ index: i, error: 'Missing required fields: event_type, action, outcome' });
          continue;
        }

        const securityEvent = await securityService.logSecurityEvent({
          event_type: event.event_type,
          severity: event.severity || 'medium',
          source_ip: event.source_ip,
          user_id: event.user_id,
          username: event.username,
          resource: event.resource,
          action: event.action,
          outcome: event.outcome,
          timestamp: event.timestamp || new Date().toISOString(),
          details: event.details || {},
        });

        results.push(securityEvent);
      } catch (error) {
        errors.push({ index: i, error: (error as Error).message });
      }
    }

    res.json({
      results,
      errors,
      summary: {
        total_submitted: events.length,
        successful: results.length,
        failed: errors.length,
      },
      message: 'Batch security events processed',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Failed to process batch security events:', error);
    res.status(500).json({ error: 'Failed to process batch security events' });
  }
});

export { router as securityRoutes };