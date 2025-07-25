import { postgres } from '../config/database';
import { logger } from '../config/logger';
import { metricsService } from './metricsService';

export interface AlertRule {
  id: number;
  name: string;
  description?: string;
  metric_name: string;
  service?: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  duration_minutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification_channels: string[]; // Array of channel IDs
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Alert {
  id: number;
  rule_id: number;
  rule_name: string;
  metric_name: string;
  service?: string;
  current_value: number;
  threshold: number;
  condition: string;
  severity: string;
  status: 'active' | 'acknowledged' | 'resolved';
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: number;
  resolved_at?: string;
  notification_sent: boolean;
  message: string;
}

export interface NotificationChannel {
  id: number;
  name: string;
  type: 'email' | 'webhook' | 'slack';
  config: any; // Configuration specific to channel type
  enabled: boolean;
  created_at: string;
}

export interface CreateAlertRuleData {
  name: string;
  description?: string;
  metric_name: string;
  service?: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  threshold: number;
  duration_minutes: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  notification_channels: string[];
  created_by: number;
}

export interface CreateNotificationChannelData {
  name: string;
  type: 'email' | 'webhook' | 'slack';
  config: any;
}

class AlertService {
  // Fallback storage when PostgreSQL is not available
  private fallbackAlertRules: AlertRule[] = [];
  private fallbackAlerts: Alert[] = [];
  private fallbackNotificationChannels: NotificationChannel[] = [
    {
      id: 1,
      name: 'Default Email',
      type: 'email',
      config: { recipients: ['admin@argus.local'] },
      enabled: true,
      created_at: new Date().toISOString(),
    },
  ];
  
  private nextRuleId = 1;
  private nextAlertId = 1;
  private nextChannelId = 2;

  // Alert Rules Management
  async createAlertRule(ruleData: CreateAlertRuleData): Promise<AlertRule> {
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
      created_by,
    } = ruleData;

    if (postgres) {
      try {
        const result = await postgres.query(
          `INSERT INTO alert_rules 
           (name, description, metric_name, service, condition, threshold, duration_minutes, 
            severity, notification_channels, enabled, created_by, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, NOW(), NOW())
           RETURNING *`,
          [name, description, metric_name, service, condition, threshold, 
            duration_minutes, severity, JSON.stringify(notification_channels), created_by]
        );

        const rule = result.rows[0];
        rule.notification_channels = JSON.parse(rule.notification_channels);
        logger.info(`Alert rule created: ${name}`);
        return rule;
      } catch (error: any) {
        logger.error('Failed to create alert rule:', error);
        throw new Error('Failed to create alert rule');
      }
    } else {
      // Fallback to in-memory storage
      const newRule: AlertRule = {
        id: this.nextRuleId++,
        name,
        description,
        metric_name,
        service,
        condition,
        threshold,
        duration_minutes,
        severity,
        enabled: true,
        notification_channels,
        created_by,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.fallbackAlertRules.push(newRule);
      logger.info(`Alert rule created in memory: ${name}`);
      return newRule;
    }
  }

  async getAlertRules(): Promise<AlertRule[]> {
    if (postgres) {
      try {
        const result = await postgres.query(
          'SELECT * FROM alert_rules ORDER BY created_at DESC'
        );

        return result.rows.map(rule => ({
          ...rule,
          notification_channels: JSON.parse(rule.notification_channels || '[]'),
        }));
      } catch (error) {
        logger.error('Failed to fetch alert rules:', error);
        return [];
      }
    } else {
      return this.fallbackAlertRules;
    }
  }

  async getAlertRule(id: number): Promise<AlertRule | null> {
    if (postgres) {
      try {
        const result = await postgres.query('SELECT * FROM alert_rules WHERE id = $1', [id]);
        const rule = result.rows[0];
        
        if (rule) {
          rule.notification_channels = JSON.parse(rule.notification_channels || '[]');
        }
        
        return rule || null;
      } catch (error) {
        logger.error('Failed to fetch alert rule:', error);
        return null;
      }
    } else {
      return this.fallbackAlertRules.find(rule => rule.id === id) || null;
    }
  }

  async updateAlertRule(id: number, updates: Partial<CreateAlertRuleData>): Promise<AlertRule | null> {
    if (postgres) {
      try {
        const setClause = Object.keys(updates)
          .map((key, index) => `${key} = $${index + 2}`)
          .join(', ');

        const values = [id, ...Object.values(updates)];
        
        if (updates.notification_channels) {
          values[values.length - 1] = JSON.stringify(updates.notification_channels);
        }

        const result = await postgres.query(
          `UPDATE alert_rules SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
          values
        );

        const rule = result.rows[0];
        if (rule) {
          rule.notification_channels = JSON.parse(rule.notification_channels || '[]');
        }

        return rule || null;
      } catch (error) {
        logger.error('Failed to update alert rule:', error);
        return null;
      }
    } else {
      const ruleIndex = this.fallbackAlertRules.findIndex(rule => rule.id === id);
      if (ruleIndex === -1) return null;

      this.fallbackAlertRules[ruleIndex] = {
        ...this.fallbackAlertRules[ruleIndex],
        ...updates,
        updated_at: new Date().toISOString(),
      };

      return this.fallbackAlertRules[ruleIndex];
    }
  }

  async deleteAlertRule(id: number): Promise<boolean> {
    if (postgres) {
      try {
        await postgres.query('DELETE FROM alert_rules WHERE id = $1', [id]);
        return true;
      } catch (error) {
        logger.error('Failed to delete alert rule:', error);
        return false;
      }
    } else {
      const ruleIndex = this.fallbackAlertRules.findIndex(rule => rule.id === id);
      if (ruleIndex === -1) return false;

      this.fallbackAlertRules.splice(ruleIndex, 1);
      return true;
    }
  }

  // Alert Management
  async createAlert(alertData: Omit<Alert, 'id' | 'triggered_at' | 'notification_sent'>): Promise<Alert> {
    const newAlert: Alert = {
      ...alertData,
      id: this.nextAlertId++,
      triggered_at: new Date().toISOString(),
      notification_sent: false,
    };

    if (postgres) {
      try {
        const result = await postgres.query(
          `INSERT INTO alerts 
           (rule_id, rule_name, metric_name, service, current_value, threshold, condition, 
            severity, status, triggered_at, message, notification_sent)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, false)
           RETURNING *`,
          [alertData.rule_id, alertData.rule_name, alertData.metric_name, alertData.service,
            alertData.current_value, alertData.threshold, alertData.condition, 
            alertData.severity, alertData.status, newAlert.triggered_at, alertData.message]
        );

        return result.rows[0];
      } catch (error) {
        logger.error('Failed to create alert:', error);
        throw new Error('Failed to create alert');
      }
    } else {
      this.fallbackAlerts.push(newAlert);
      return newAlert;
    }
  }

  async getAlerts(status?: string, severity?: string): Promise<Alert[]> {
    if (postgres) {
      try {
        let query = 'SELECT * FROM alerts';
        const conditions: string[] = [];
        const values: any[] = [];

        if (status) {
          conditions.push(`status = $${conditions.length + 1}`);
          values.push(status);
        }

        if (severity) {
          conditions.push(`severity = $${conditions.length + 1}`);
          values.push(severity);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY triggered_at DESC';

        const result = await postgres.query(query, values);
        return result.rows;
      } catch (error) {
        logger.error('Failed to fetch alerts:', error);
        return [];
      }
    } else {
      let alerts = this.fallbackAlerts;

      if (status) {
        alerts = alerts.filter(alert => alert.status === status);
      }

      if (severity) {
        alerts = alerts.filter(alert => alert.severity === severity);
      }

      return alerts.sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime());
    }
  }

  async acknowledgeAlert(alertId: number, userId: number): Promise<boolean> {
    const acknowledgedAt = new Date().toISOString();

    if (postgres) {
      try {
        await postgres.query(
          'UPDATE alerts SET status = $1, acknowledged_at = $2, acknowledged_by = $3 WHERE id = $4',
          ['acknowledged', acknowledgedAt, userId, alertId]
        );
        return true;
      } catch (error) {
        logger.error('Failed to acknowledge alert:', error);
        return false;
      }
    } else {
      const alertIndex = this.fallbackAlerts.findIndex(alert => alert.id === alertId);
      if (alertIndex === -1) return false;

      this.fallbackAlerts[alertIndex].status = 'acknowledged';
      this.fallbackAlerts[alertIndex].acknowledged_at = acknowledgedAt;
      this.fallbackAlerts[alertIndex].acknowledged_by = userId;
      return true;
    }
  }

  async resolveAlert(alertId: number): Promise<boolean> {
    const resolvedAt = new Date().toISOString();

    if (postgres) {
      try {
        await postgres.query(
          'UPDATE alerts SET status = $1, resolved_at = $2 WHERE id = $3',
          ['resolved', resolvedAt, alertId]
        );
        return true;
      } catch (error) {
        logger.error('Failed to resolve alert:', error);
        return false;
      }
    } else {
      const alertIndex = this.fallbackAlerts.findIndex(alert => alert.id === alertId);
      if (alertIndex === -1) return false;

      this.fallbackAlerts[alertIndex].status = 'resolved';
      this.fallbackAlerts[alertIndex].resolved_at = resolvedAt;
      return true;
    }
  }

  // Notification Channels Management
  async createNotificationChannel(channelData: CreateNotificationChannelData): Promise<NotificationChannel> {
    const newChannel: NotificationChannel = {
      id: this.nextChannelId++,
      ...channelData,
      enabled: true,
      created_at: new Date().toISOString(),
    };

    if (postgres) {
      try {
        const result = await postgres.query(
          `INSERT INTO notification_channels (name, type, config, enabled, created_at)
           VALUES ($1, $2, $3, true, NOW())
           RETURNING *`,
          [channelData.name, channelData.type, JSON.stringify(channelData.config)]
        );

        const channel = result.rows[0];
        channel.config = JSON.parse(channel.config);
        return channel;
      } catch (error) {
        logger.error('Failed to create notification channel:', error);
        throw new Error('Failed to create notification channel');
      }
    } else {
      this.fallbackNotificationChannels.push(newChannel);
      return newChannel;
    }
  }

  async getNotificationChannels(): Promise<NotificationChannel[]> {
    if (postgres) {
      try {
        const result = await postgres.query('SELECT * FROM notification_channels ORDER BY created_at DESC');
        return result.rows.map(channel => ({
          ...channel,
          config: JSON.parse(channel.config),
        }));
      } catch (error) {
        logger.error('Failed to fetch notification channels:', error);
        return [];
      }
    } else {
      return this.fallbackNotificationChannels;
    }
  }

  // Alert Rule Evaluation
  async evaluateAlertRules(): Promise<void> {
    try {
      const rules = await this.getAlertRules();
      const enabledRules = rules.filter(rule => rule.enabled);

      for (const rule of enabledRules) {
        await this.evaluateRule(rule);
      }
    } catch (error) {
      logger.error('Failed to evaluate alert rules:', error);
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<void> {
    try {
      // Get recent metrics for this rule
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - rule.duration_minutes * 60 * 1000);

      // This would need to be implemented based on your metrics service
      // For now, we'll use a placeholder that checks the latest metric
      const metrics = await metricsService.getMetrics(
        rule.metric_name,
        rule.service,
        startTime.toISOString(),
        endTime.toISOString()
      );

      if (metrics.length === 0) return;

      const latestMetric = metrics[metrics.length - 1];
      const currentValue = latestMetric.value;

      const isTriggered = this.evaluateCondition(
        currentValue,
        rule.condition,
        rule.threshold
      );

      if (isTriggered) {
        // Check if there's already an active alert for this rule
        const existingAlerts = await this.getAlerts('active');
        const existingAlert = existingAlerts.find(alert => 
          alert.rule_id === rule.id && alert.status === 'active'
        );

        if (!existingAlert) {
          // Create new alert
          const alertMessage = this.generateAlertMessage(rule, currentValue);
          
          await this.createAlert({
            rule_id: rule.id,
            rule_name: rule.name,
            metric_name: rule.metric_name,
            service: rule.service,
            current_value: currentValue,
            threshold: rule.threshold,
            condition: rule.condition,
            severity: rule.severity,
            status: 'active',
            message: alertMessage,
          });

          logger.warn(`Alert triggered: ${rule.name} - ${alertMessage}`);
        }
      } else {
        // Check if we should resolve any existing alerts
        const existingAlerts = await this.getAlerts('active');
        const existingAlert = existingAlerts.find(alert => 
          alert.rule_id === rule.id && alert.status === 'active'
        );

        if (existingAlert) {
          await this.resolveAlert(existingAlert.id);
          logger.info(`Alert resolved: ${rule.name}`);
        }
      }
    } catch (error) {
      logger.error(`Failed to evaluate rule ${rule.name}:`, error);
    }
  }

  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
    case 'greater_than':
      return value > threshold;
    case 'less_than':
      return value < threshold;
    case 'equals':
      return Math.abs(value - threshold) < 0.001; // Float comparison with tolerance
    case 'not_equals':
      return Math.abs(value - threshold) >= 0.001;
    default:
      return false;
    }
  }

  private generateAlertMessage(rule: AlertRule, currentValue: number): string {
    const service = rule.service ? ` for service ${rule.service}` : '';
    return `${rule.metric_name}${service} is ${currentValue}, which is ${rule.condition.replace('_', ' ')} ${rule.threshold}`;
  }

  // Notification sending (placeholder - would integrate with actual notification services)
  async sendNotification(alert: Alert, channels: NotificationChannel[]): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) continue;

      try {
        switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(alert, channel);
          break;
        case 'webhook':
          await this.sendWebhookNotification(alert, channel);
          break;
        case 'slack':
          await this.sendSlackNotification(alert, channel);
          break;
        }
        
        logger.info(`Notification sent via ${channel.type}: ${channel.name}`);
      } catch (error) {
        logger.error(`Failed to send notification via ${channel.type}:`, error);
      }
    }
  }

  private async sendEmailNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // Placeholder - would integrate with email service
    logger.info(`Email notification: ${alert.message} to ${channel.config.recipients?.join(', ')}`);
  }

  private async sendWebhookNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // Placeholder - would make HTTP request to webhook URL
    logger.info(`Webhook notification: ${alert.message} to ${channel.config.url}`);
  }

  private async sendSlackNotification(alert: Alert, channel: NotificationChannel): Promise<void> {
    // Placeholder - would integrate with Slack API
    logger.info(`Slack notification: ${alert.message} to ${channel.config.webhook_url}`);
  }
}

export const alertService = new AlertService();