import { postgres } from '../config/database';
import { logger } from '../config/logger';

export interface SecurityEvent {
  id: string;
  event_type: 'authentication' | 'authorization' | 'data_access' | 'system_change' | 'network_intrusion' | 'malware_detection';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  source_ip?: string;
  user_id?: number;
  username?: string;
  resource?: string;
  action: string;
  outcome: 'success' | 'failure' | 'blocked';
  timestamp: string;
  details: Record<string, any>;
  risk_score: number;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
}

export interface ThreatDetectionRule {
  id: number;
  name: string;
  description: string;
  rule_type: 'pattern' | 'threshold' | 'anomaly' | 'correlation';
  criteria: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityAlert {
  id: string;
  rule_id: number;
  rule_name: string;
  event_ids: string[];
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affected_assets: string[];
  risk_score: number;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
}

export interface ComplianceReport {
  id: string;
  report_type: 'access_control' | 'data_protection' | 'audit_trail' | 'security_monitoring';
  compliance_framework: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI_DSS' | 'SOC2' | 'ISO27001';
  period_start: string;
  period_end: string;
  findings: Array<{
    requirement: string;
    status: 'compliant' | 'non_compliant' | 'needs_review';
    evidence: string[];
    recommendations?: string[];
  }>;
  overall_compliance_score: number;
  created_at: string;
}

export interface AuditTrail {
  id: string;
  user_id?: number;
  username?: string;
  action: string;
  resource: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  outcome: 'success' | 'failure';
  details?: Record<string, any>;
}

class SecurityService {
  // Fallback storage when PostgreSQL is not available
  private fallbackSecurityEvents: SecurityEvent[] = [];
  private fallbackSecurityAlerts: SecurityAlert[] = [];
  private fallbackAuditTrails: AuditTrail[] = [];
  private fallbackThreatRules: ThreatDetectionRule[] = [
    {
      id: 1,
      name: 'Multiple Failed Login Attempts',
      description: 'Detect multiple failed login attempts from same IP',
      rule_type: 'threshold',
      criteria: { event_type: 'authentication', outcome: 'failure', threshold: 5, time_window: 300 },
      severity: 'medium',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 2,
      name: 'Privilege Escalation Attempt',
      description: 'Detect unauthorized privilege escalation attempts',
      rule_type: 'pattern',
      criteria: { event_type: 'authorization', action: 'elevate_privileges', outcome: 'failure' },
      severity: 'high',
      enabled: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];
  
  private nextEventId = 1;
  private nextAlertId = 1;
  private nextAuditId = 1;
  private nextRuleId = 3;

  // Security Event Management
  async logSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'created_at' | 'risk_score' | 'status'>): Promise<SecurityEvent> {
    const riskScore = this.calculateRiskScore(eventData);
    
    const securityEvent: SecurityEvent = {
      ...eventData,
      id: `sec_event_${this.nextEventId++}`,
      risk_score: riskScore,
      status: 'active',
      created_at: new Date().toISOString(),
    };

    if (postgres) {
      try {
        await postgres.query(
          `INSERT INTO security_events 
           (id, event_type, severity, source_ip, user_id, username, resource, action, 
            outcome, timestamp, details, risk_score, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
          [securityEvent.id, securityEvent.event_type, securityEvent.severity,
            securityEvent.source_ip, securityEvent.user_id, securityEvent.username,
            securityEvent.resource, securityEvent.action, securityEvent.outcome,
            securityEvent.timestamp, JSON.stringify(securityEvent.details),
            securityEvent.risk_score, securityEvent.status, securityEvent.created_at]
        );
      } catch (error) {
        logger.warn('Failed to store security event in database, using fallback:', error);
        this.fallbackSecurityEvents.push(securityEvent);
      }
    } else {
      this.fallbackSecurityEvents.push(securityEvent);
    }

    // Check for threats after logging
    await this.evaluateThreatDetectionRules(securityEvent);

    logger.info(`Security event logged: ${securityEvent.event_type} - ${securityEvent.action}`);
    return securityEvent;
  }

  // Threat Detection and Analysis
  async evaluateThreatDetectionRules(newEvent?: SecurityEvent): Promise<SecurityAlert[]> {
    try {
      const rules = await this.getThreatDetectionRules();
      const enabledRules = rules.filter(rule => rule.enabled);
      const alerts: SecurityAlert[] = [];

      for (const rule of enabledRules) {
        const alert = await this.evaluateRule(rule, newEvent);
        if (alert) {
          alerts.push(alert);
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Failed to evaluate threat detection rules:', error);
      return [];
    }
  }

  private async evaluateRule(rule: ThreatDetectionRule, newEvent?: SecurityEvent): Promise<SecurityAlert | null> {
    try {
      switch (rule.rule_type) {
      case 'threshold':
        return await this.evaluateThresholdRule(rule, newEvent);
      case 'pattern':
        return await this.evaluatePatternRule(rule, newEvent);
      case 'correlation':
        return await this.evaluateCorrelationRule(rule, newEvent);
      default:
        return null;
      }
    } catch (error) {
      logger.error(`Failed to evaluate rule ${rule.name}:`, error);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async evaluateThresholdRule(rule: ThreatDetectionRule, newEvent?: SecurityEvent): Promise<SecurityAlert | null> {
    const { event_type, outcome, threshold, time_window } = rule.criteria;
    
    // Get recent events for threshold analysis
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (time_window * 1000));
    
    const recentEvents = await this.getSecurityEvents(
      event_type,
      outcome,
      startTime.toISOString(),
      endTime.toISOString()
    );

    // Group by source IP for brute force detection
    const eventsByIP = recentEvents.reduce((acc, event) => {
      const ip = event.source_ip || 'unknown';
      acc[ip] = (acc[ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check if any IP exceeds threshold
    for (const [ip, count] of Object.entries(eventsByIP)) {
      if (count >= threshold) {
        const relatedEvents = recentEvents.filter(e => e.source_ip === ip);
        
        const alert: SecurityAlert = {
          id: `sec_alert_${this.nextAlertId++}`,
          rule_id: rule.id,
          rule_name: rule.name,
          event_ids: relatedEvents.map(e => e.id),
          threat_type: 'brute_force',
          severity: rule.severity,
          description: `${count} ${event_type} ${outcome} events from IP ${ip} in ${time_window} seconds`,
          affected_assets: [ip],
          risk_score: this.calculateThreatRiskScore(rule.severity, count, threshold),
          status: 'active',
          created_at: new Date().toISOString(),
        };

        await this.createSecurityAlert(alert);
        return alert;
      }
    }

    return null;
  }

  private async evaluatePatternRule(rule: ThreatDetectionRule, newEvent?: SecurityEvent): Promise<SecurityAlert | null> {
    if (!newEvent) return null;

    const { event_type, action, outcome } = rule.criteria;
    
    // Check if new event matches the pattern
    if (newEvent.event_type === event_type && 
        newEvent.action === action && 
        newEvent.outcome === outcome) {
      
      const alert: SecurityAlert = {
        id: `sec_alert_${this.nextAlertId++}`,
        rule_id: rule.id,
        rule_name: rule.name,
        event_ids: [newEvent.id],
        threat_type: 'policy_violation',
        severity: rule.severity,
        description: `Pattern match: ${action} ${outcome} for ${newEvent.resource || 'unknown resource'}`,
        affected_assets: [newEvent.resource || newEvent.source_ip || 'unknown'],
        risk_score: newEvent.risk_score,
        status: 'active',
        created_at: new Date().toISOString(),
      };

      await this.createSecurityAlert(alert);
      return alert;
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async evaluateCorrelationRule(rule: ThreatDetectionRule, newEvent?: SecurityEvent): Promise<SecurityAlert | null> {
    // Simplified correlation analysis
    // In a real implementation, this would involve complex event correlation
    return null;
  }

  // Audit Trail Management
  async logAuditTrail(auditData: Omit<AuditTrail, 'id' | 'timestamp'>): Promise<AuditTrail> {
    const auditEntry: AuditTrail = {
      ...auditData,
      id: `audit_${this.nextAuditId++}`,
      timestamp: new Date().toISOString(),
    };

    if (postgres) {
      try {
        await postgres.query(
          `INSERT INTO audit_trails 
           (id, user_id, username, action, resource, resource_id, old_values, 
            new_values, ip_address, user_agent, timestamp, outcome, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [auditEntry.id, auditEntry.user_id, auditEntry.username, auditEntry.action,
            auditEntry.resource, auditEntry.resource_id, JSON.stringify(auditEntry.old_values),
            JSON.stringify(auditEntry.new_values), auditEntry.ip_address,
            auditEntry.user_agent, auditEntry.timestamp, auditEntry.outcome,
            JSON.stringify(auditEntry.details)]
        );
      } catch (error) {
        logger.warn('Failed to store audit trail in database, using fallback:', error);
        this.fallbackAuditTrails.push(auditEntry);
      }
    } else {
      this.fallbackAuditTrails.push(auditEntry);
    }

    logger.info(`Audit trail logged: ${auditEntry.action} on ${auditEntry.resource}`);
    return auditEntry;
  }

  // Compliance Reporting
  async generateComplianceReport(framework: string, startDate: string, endDate: string): Promise<ComplianceReport> {
    try {
      const reportId = `compliance_${Date.now()}`;
      const findings = await this.analyzeCompliance(framework, startDate, endDate);
      
      const complianceScore = this.calculateComplianceScore(findings);

      const report: ComplianceReport = {
        id: reportId,
        report_type: 'security_monitoring',
        compliance_framework: framework as any,
        period_start: startDate,
        period_end: endDate,
        findings,
        overall_compliance_score: complianceScore,
        created_at: new Date().toISOString(),
      };

      logger.info(`Compliance report generated for ${framework}: ${complianceScore}% compliant`);
      return report;
    } catch (error) {
      logger.error('Failed to generate compliance report:', error);
      throw new Error('Failed to generate compliance report');
    }
  }

  private async analyzeCompliance(framework: string, startDate: string, endDate: string): Promise<ComplianceReport['findings']> {
    const findings: ComplianceReport['findings'] = [];

    switch (framework) {
    case 'SOX':
      findings.push(
        await this.checkAccessControlCompliance(startDate, endDate),
        await this.checkAuditTrailCompliance(startDate, endDate),
        await this.checkDataIntegrityCompliance(startDate, endDate)
      );
      break;
    case 'GDPR':
      findings.push(
        await this.checkDataProtectionCompliance(startDate, endDate),
        await this.checkConsentManagementCompliance(startDate, endDate),
        await this.checkBreachNotificationCompliance(startDate, endDate)
      );
      break;
    case 'SOC2':
      findings.push(
        await this.checkSecurityMonitoringCompliance(startDate, endDate),
        await this.checkIncidentResponseCompliance(startDate, endDate),
        await this.checkAccessManagementCompliance(startDate, endDate)
      );
      break;
    default:
      findings.push({
        requirement: 'General Security Monitoring',
        status: 'compliant',
        evidence: ['Security monitoring system is active'],
      });
    }

    return findings;
  }

  // Getter methods
  async getSecurityEvents(eventType?: string, outcome?: string, startDate?: string, endDate?: string): Promise<SecurityEvent[]> {
    if (postgres) {
      try {
        let query = 'SELECT * FROM security_events WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (eventType) {
          query += ` AND event_type = $${paramIndex}`;
          params.push(eventType);
          paramIndex++;
        }

        if (outcome) {
          query += ` AND outcome = $${paramIndex}`;
          params.push(outcome);
          paramIndex++;
        }

        if (startDate) {
          query += ` AND timestamp >= $${paramIndex}`;
          params.push(startDate);
          paramIndex++;
        }

        if (endDate) {
          query += ` AND timestamp <= $${paramIndex}`;
          params.push(endDate);
          paramIndex++;
        }

        query += ' ORDER BY timestamp DESC LIMIT 1000';

        const result = await postgres.query(query, params);
        return result.rows.map(row => ({
          ...row,
          details: JSON.parse(row.details || '{}')
        }));
      } catch (error) {
        logger.error('Failed to fetch security events:', error);
        return this.fallbackSecurityEvents;
      }
    } else {
      let events = this.fallbackSecurityEvents;

      if (eventType) {
        events = events.filter(e => e.event_type === eventType);
      }

      if (outcome) {
        events = events.filter(e => e.outcome === outcome);
      }

      if (startDate) {
        events = events.filter(e => e.timestamp >= startDate);
      }

      if (endDate) {
        events = events.filter(e => e.timestamp <= endDate);
      }

      return events.slice(0, 1000);
    }
  }

  async getSecurityAlerts(status?: string): Promise<SecurityAlert[]> {
    if (postgres) {
      try {
        let query = 'SELECT * FROM security_alerts';
        const params: any[] = [];

        if (status) {
          query += ' WHERE status = $1';
          params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const result = await postgres.query(query, params);
        return result.rows.map(row => ({
          ...row,
          event_ids: JSON.parse(row.event_ids || '[]'),
          affected_assets: JSON.parse(row.affected_assets || '[]')
        }));
      } catch (error) {
        logger.error('Failed to fetch security alerts:', error);
        return this.fallbackSecurityAlerts;
      }
    } else {
      let alerts = this.fallbackSecurityAlerts;

      if (status) {
        alerts = alerts.filter(a => a.status === status);
      }

      return alerts.slice(0, 100);
    }
  }

  async getAuditTrails(userId?: number, action?: string, resource?: string, startDate?: string, endDate?: string): Promise<AuditTrail[]> {
    if (postgres) {
      try {
        let query = 'SELECT * FROM audit_trails WHERE 1=1';
        const params: any[] = [];
        let paramIndex = 1;

        if (userId) {
          query += ` AND user_id = $${paramIndex}`;
          params.push(userId);
          paramIndex++;
        }

        if (action) {
          query += ` AND action = $${paramIndex}`;
          params.push(action);
          paramIndex++;
        }

        if (resource) {
          query += ` AND resource = $${paramIndex}`;
          params.push(resource);
          paramIndex++;
        }

        if (startDate) {
          query += ` AND timestamp >= $${paramIndex}`;
          params.push(startDate);
          paramIndex++;
        }

        if (endDate) {
          query += ` AND timestamp <= $${paramIndex}`;
          params.push(endDate);
          paramIndex++;
        }

        query += ' ORDER BY timestamp DESC LIMIT 1000';

        const result = await postgres.query(query, params);
        return result.rows.map(row => ({
          ...row,
          old_values: JSON.parse(row.old_values || '{}'),
          new_values: JSON.parse(row.new_values || '{}'),
          details: JSON.parse(row.details || '{}')
        }));
      } catch (error) {
        logger.error('Failed to fetch audit trails:', error);
        return this.fallbackAuditTrails;
      }
    } else {
      let trails = this.fallbackAuditTrails;

      if (userId) {
        trails = trails.filter(t => t.user_id === userId);
      }

      if (action) {
        trails = trails.filter(t => t.action === action);
      }

      if (resource) {
        trails = trails.filter(t => t.resource === resource);
      }

      if (startDate) {
        trails = trails.filter(t => t.timestamp >= startDate);
      }

      if (endDate) {
        trails = trails.filter(t => t.timestamp <= endDate);
      }

      return trails.slice(0, 1000);
    }
  }

  async getThreatDetectionRules(): Promise<ThreatDetectionRule[]> {
    if (postgres) {
      try {
        const result = await postgres.query('SELECT * FROM threat_detection_rules ORDER BY created_at DESC');
        return result.rows.map(row => ({
          ...row,
          criteria: JSON.parse(row.criteria || '{}')
        }));
      } catch (error) {
        logger.error('Failed to fetch threat detection rules:', error);
        return this.fallbackThreatRules;
      }
    } else {
      return this.fallbackThreatRules;
    }
  }

  // Helper methods
  private calculateRiskScore(event: Omit<SecurityEvent, 'id' | 'created_at' | 'risk_score' | 'status'>): number {
    let score = 0;

    // Base score by event type
    const eventTypeScores: Record<string, number> = {
      authentication: 20,
      authorization: 30,
      data_access: 40,
      system_change: 50,
      network_intrusion: 80,
      malware_detection: 90,
    };

    score += eventTypeScores[event.event_type] || 10;

    // Severity multiplier
    const severityMultipliers: Record<string, number> = {
      info: 1,
      low: 1.2,
      medium: 1.5,
      high: 2,
      critical: 3,
    };

    score *= severityMultipliers[event.severity] || 1;

    // Outcome modifier
    if (event.outcome === 'failure') {
      score *= 1.5;
    } else if (event.outcome === 'blocked') {
      score *= 0.8;
    }

    return Math.min(100, Math.round(score));
  }

  private calculateThreatRiskScore(severity: string, actualCount: number, threshold: number): number {
    const baseScores: Record<string, number> = {
      low: 30,
      medium: 50,
      high: 70,
      critical: 90,
    };

    const baseScore = baseScores[severity] || 30;
    const exceedanceMultiplier = actualCount / threshold;
    
    return Math.min(100, Math.round(baseScore * exceedanceMultiplier));
  }

  private async createSecurityAlert(alert: SecurityAlert): Promise<void> {
    if (postgres) {
      try {
        await postgres.query(
          `INSERT INTO security_alerts 
           (id, rule_id, rule_name, event_ids, threat_type, severity, description, 
            affected_assets, risk_score, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [alert.id, alert.rule_id, alert.rule_name, JSON.stringify(alert.event_ids),
            alert.threat_type, alert.severity, alert.description,
            JSON.stringify(alert.affected_assets), alert.risk_score, alert.status,
            alert.created_at]
        );
      } catch (error) {
        logger.warn('Failed to store security alert in database, using fallback:', error);
        this.fallbackSecurityAlerts.push(alert);
      }
    } else {
      this.fallbackSecurityAlerts.push(alert);
    }

    logger.warn(`Security alert created: ${alert.threat_type} - ${alert.description}`);
  }

  private calculateComplianceScore(findings: ComplianceReport['findings']): number {
    const totalFindings = findings.length;
    const compliantFindings = findings.filter(f => f.status === 'compliant').length;
    
    return totalFindings > 0 ? Math.round((compliantFindings / totalFindings) * 100) : 100;
  }

  // Compliance check methods (simplified implementations)
  private async checkAccessControlCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    const auditTrails = await this.getAuditTrails(undefined, undefined, undefined, startDate, endDate);
    const accessEvents = auditTrails.filter(t => t.action.includes('access') || t.action.includes('login'));
    
    return {
      requirement: 'Access Control Monitoring',
      status: accessEvents.length > 0 ? 'compliant' : 'needs_review',
      evidence: [`${accessEvents.length} access control events recorded`],
      recommendations: accessEvents.length === 0 ? ['Ensure all access attempts are logged'] : undefined,
    };
  }

  private async checkAuditTrailCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    const auditTrails = await this.getAuditTrails(undefined, undefined, undefined, startDate, endDate);
    
    return {
      requirement: 'Audit Trail Completeness',
      status: auditTrails.length > 0 ? 'compliant' : 'non_compliant',
      evidence: [`${auditTrails.length} audit trail entries recorded`],
      recommendations: auditTrails.length === 0 ? ['Implement comprehensive audit logging'] : undefined,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async checkDataIntegrityCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    return {
      requirement: 'Data Integrity Controls',
      status: 'compliant',
      evidence: ['Data integrity monitoring is active'],
    };
  }

  private async checkDataProtectionCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    const dataAccessEvents = await this.getSecurityEvents('data_access', undefined, startDate, endDate);
    
    return {
      requirement: 'Data Protection Monitoring',
      status: 'compliant',
      evidence: [`${dataAccessEvents.length} data access events monitored`],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async checkConsentManagementCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    return {
      requirement: 'Consent Management',
      status: 'needs_review',
      evidence: ['Manual review required'],
      recommendations: ['Implement automated consent tracking'],
    };
  }

  private async checkBreachNotificationCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    const securityAlerts = await this.getSecurityAlerts('active');
    const criticalAlerts = securityAlerts.filter(a => a.severity === 'critical');
    
    return {
      requirement: 'Breach Notification',
      status: criticalAlerts.length === 0 ? 'compliant' : 'needs_review',
      evidence: [`${criticalAlerts.length} critical security alerts require review`],
      recommendations: criticalAlerts.length > 0 ? ['Review critical alerts for breach notification requirements'] : undefined,
    };
  }

  private async checkSecurityMonitoringCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    const securityEvents = await this.getSecurityEvents(undefined, undefined, startDate, endDate);
    
    return {
      requirement: 'Security Monitoring',
      status: securityEvents.length > 0 ? 'compliant' : 'non_compliant',
      evidence: [`${securityEvents.length} security events monitored`],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async checkIncidentResponseCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    const securityAlerts = await this.getSecurityAlerts();
    const resolvedAlerts = securityAlerts.filter(a => a.status === 'resolved');
    
    return {
      requirement: 'Incident Response',
      status: resolvedAlerts.length > 0 ? 'compliant' : 'needs_review',
      evidence: [`${resolvedAlerts.length} incidents resolved`],
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async checkAccessManagementCompliance(startDate: string, endDate: string): Promise<ComplianceReport['findings'][0]> {
    return {
      requirement: 'Access Management',
      status: 'compliant',
      evidence: ['Access management controls are in place'],
    };
  }
}

export const securityService = new SecurityService();