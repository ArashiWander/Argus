-- Phase 4 Database Schema: AI Analytics, Security Monitoring, and Compliance

-- Anomaly Detection Table
CREATE TABLE IF NOT EXISTS anomalies (
    id VARCHAR(255) PRIMARY KEY,
    metric_name VARCHAR(255) NOT NULL,
    service VARCHAR(255),
    timestamp TIMESTAMPTZ NOT NULL,
    expected_value NUMERIC NOT NULL,
    actual_value NUMERIC NOT NULL,
    anomaly_score NUMERIC NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_metric_service ON anomalies(metric_name, service);
CREATE INDEX IF NOT EXISTS idx_anomalies_timestamp ON anomalies(timestamp);
CREATE INDEX IF NOT EXISTS idx_anomalies_status ON anomalies(status);
CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON anomalies(severity);

-- Performance Insights Table
CREATE TABLE IF NOT EXISTS performance_insights (
    id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('bottleneck', 'optimization', 'capacity', 'trend')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    affected_services JSONB NOT NULL DEFAULT '[]',
    recommended_actions JSONB NOT NULL DEFAULT '[]',
    confidence_score NUMERIC NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'dismissed'))
);

CREATE INDEX IF NOT EXISTS idx_performance_insights_type ON performance_insights(type);
CREATE INDEX IF NOT EXISTS idx_performance_insights_severity ON performance_insights(severity);
CREATE INDEX IF NOT EXISTS idx_performance_insights_created_at ON performance_insights(created_at);

-- Security Events Table
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('authentication', 'authorization', 'data_access', 'system_change', 'network_intrusion', 'malware_detection')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'low', 'medium', 'high', 'critical')),
    source_ip INET,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(255),
    resource VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure', 'blocked')),
    timestamp TIMESTAMPTZ NOT NULL,
    details JSONB NOT NULL DEFAULT '{}',
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX IF NOT EXISTS idx_security_events_outcome ON security_events(outcome);
CREATE INDEX IF NOT EXISTS idx_security_events_risk_score ON security_events(risk_score);

-- Threat Detection Rules Table
CREATE TABLE IF NOT EXISTS threat_detection_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('pattern', 'threshold', 'anomaly', 'correlation')),
    criteria JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_rules_enabled ON threat_detection_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_threat_rules_type ON threat_detection_rules(rule_type);

-- Security Alerts Table
CREATE TABLE IF NOT EXISTS security_alerts (
    id VARCHAR(255) PRIMARY KEY,
    rule_id INTEGER REFERENCES threat_detection_rules(id),
    rule_name VARCHAR(255) NOT NULL,
    event_ids JSONB NOT NULL DEFAULT '[]',
    threat_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    affected_assets JSONB NOT NULL DEFAULT '[]',
    risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'investigating', 'resolved', 'false_positive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_security_alerts_rule_id ON security_alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts(status);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created_at ON security_alerts(created_at);

-- Audit Trails Table
CREATE TABLE IF NOT EXISTS audit_trails (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(255),
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'failure')),
    details JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_trails_user_id ON audit_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_trails_timestamp ON audit_trails(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_trails_action ON audit_trails(action);
CREATE INDEX IF NOT EXISTS idx_audit_trails_resource ON audit_trails(resource);
CREATE INDEX IF NOT EXISTS idx_audit_trails_outcome ON audit_trails(outcome);

-- Notification Channels Table (if not exists from earlier phases)
CREATE TABLE IF NOT EXISTS notification_channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('email', 'webhook', 'slack', 'sms', 'pagerduty')),
    config JSONB NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_channels_type ON notification_channels(type);
CREATE INDEX IF NOT EXISTS idx_notification_channels_enabled ON notification_channels(enabled);

-- Update existing alert_rules table to include notification channels if not already present
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'alert_rules' AND column_name = 'notification_channels') THEN
        ALTER TABLE alert_rules ADD COLUMN notification_channels JSONB DEFAULT '[]';
    END IF;
END $$;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_anomalies_updated_at') THEN
        CREATE TRIGGER update_anomalies_updated_at 
            BEFORE UPDATE ON anomalies 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_threat_rules_updated_at') THEN
        CREATE TRIGGER update_threat_rules_updated_at 
            BEFORE UPDATE ON threat_detection_rules 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notification_channels_updated_at') THEN
        CREATE TRIGGER update_notification_channels_updated_at 
            BEFORE UPDATE ON notification_channels 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Insert default threat detection rules
INSERT INTO threat_detection_rules (name, description, rule_type, criteria, severity, enabled) 
VALUES 
    ('Multiple Failed Login Attempts', 'Detect multiple failed login attempts from same IP', 'threshold', 
     '{"event_type": "authentication", "outcome": "failure", "threshold": 5, "time_window": 300}', 'medium', true),
    ('Privilege Escalation Attempt', 'Detect unauthorized privilege escalation attempts', 'pattern', 
     '{"event_type": "authorization", "action": "elevate_privileges", "outcome": "failure"}', 'high', true),
    ('Suspicious Data Access Pattern', 'Detect unusual data access patterns', 'anomaly', 
     '{"event_type": "data_access", "anomaly_threshold": 2.5}', 'medium', true),
    ('Administrative Action Outside Hours', 'Detect admin actions outside business hours', 'pattern', 
     '{"event_type": "system_change", "user_role": "admin", "time_range": "after_hours"}', 'medium', true)
ON CONFLICT (name) DO NOTHING;

-- Insert default notification channels
INSERT INTO notification_channels (name, type, config, enabled) 
VALUES 
    ('Default Email', 'email', '{"recipients": ["admin@argus.local"], "smtp_server": "localhost"}', true),
    ('Security Webhook', 'webhook', '{"url": "http://localhost:3001/webhooks/security", "method": "POST"}', false),
    ('Security Slack', 'slack', '{"webhook_url": "", "channel": "#security-alerts"}', false)
ON CONFLICT (name) DO NOTHING;

-- Create views for common queries
CREATE OR REPLACE VIEW security_dashboard_summary AS
SELECT 
    (SELECT COUNT(*) FROM security_events WHERE timestamp >= NOW() - INTERVAL '24 hours') as events_24h,
    (SELECT COUNT(*) FROM security_alerts WHERE status = 'active') as active_alerts,
    (SELECT COUNT(*) FROM security_alerts WHERE status = 'active' AND severity = 'critical') as critical_alerts,
    (SELECT COUNT(*) FROM audit_trails WHERE timestamp >= NOW() - INTERVAL '24 hours') as audit_entries_24h,
    (SELECT COUNT(*) FROM security_events WHERE outcome = 'failure' AND timestamp >= NOW() - INTERVAL '24 hours') as failed_events_24h;

CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
    (SELECT COUNT(*) FROM anomalies WHERE status = 'active') as active_anomalies,
    (SELECT COUNT(*) FROM anomalies WHERE status = 'active' AND severity = 'critical') as critical_anomalies,
    (SELECT COUNT(*) FROM performance_insights WHERE status = 'active') as active_insights,
    (SELECT COUNT(*) FROM performance_insights WHERE status = 'active' AND severity = 'critical') as critical_insights;

-- Grant permissions (adjust as needed based on your user setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO argus_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO argus_app_user;