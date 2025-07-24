export interface Metric {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  tags: Record<string, string>;
  service: string;
  created_at: string;
}

export interface LogEntry {
  id: string;
  level: string;
  message: string;
  service: string;
  timestamp: string;
  tags: Record<string, string>;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export interface HealthStatus {
  uptime: number;
  message: string;
  timestamp: string;
  env: string;
  version: string;
  services: {
    api: string;
    database: string;
    cache: string;
    influxdb: string;
    elasticsearch: string;
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface AuthToken {
  token: string;
  expiresIn: string;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  role?: string;
}

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
  notification_channels: string[];
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
  config: any;
  enabled: boolean;
  created_at: string;
}

export interface TraceSpan {
  id: string;
  trace_id: string;
  parent_id?: string;
  operation_name: string;
  service_name: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  status: 'ok' | 'error' | 'timeout';
  tags: Record<string, any>;
  logs: Array<{
    timestamp: string;
    fields: Record<string, any>;
  }>;
  created_at: string;
}

export interface TraceData {
  trace_id: string;
  spans: TraceSpan[];
  services: string[];
  duration_ms: number;
  start_time: string;
  end_time: string;
  status: 'ok' | 'error' | 'timeout';
  root_service: string;
  root_operation: string;
}

export interface ServiceDependency {
  caller_service: string;
  callee_service: string;
  operation: string;
  call_count: number;
  error_count: number;
  avg_duration_ms: number;
  last_called: string;
}

export interface Anomaly {
  id: string;
  metric_name: string;
  service: string;
  timestamp: string;
  actual_value: number;
  expected_value: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  algorithm: string;
  description: string;
  created_at: string;
}

export interface AnomalyDetectionConfig {
  metric_name: string;
  service?: string;
  algorithm: 'zscore' | 'iqr' | 'moving_average' | 'seasonal';
  sensitivity: number;
  window_minutes: number;
  enabled: boolean;
  created_at: string;
}