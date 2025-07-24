import axios from 'axios';
import { 
  Metric, 
  LogEntry, 
  HealthStatus, 
  AuthToken, 
  LoginRequest, 
  RegisterRequest, 
  User,
  AlertRule,
  Alert,
  NotificationChannel,
  TraceSpan,
  TraceData,
  ServiceDependency
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('argus_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('argus_token');
      localStorage.removeItem('argus_user');
      // Redirect to login could be handled here
    }
    return Promise.reject(error);
  }
);

// Health API
export const healthApi = {
  getHealth: () => api.get<HealthStatus>('/health'),
  getReadiness: () => api.get('/health/ready'),
  getLiveness: () => api.get('/health/live'),
};

// Metrics API
export const metricsApi = {
  getMetrics: (params?: {
    start?: string;
    end?: string;
    service?: string;
    metric_name?: string;
  }) => api.get<{ metrics: Metric[]; count: number; timestamp: string }>('/metrics', { params }),
  
  submitMetric: (metric: Omit<Metric, 'id' | 'created_at'>) => 
    api.post('/metrics', metric),
  
  getStats: () => api.get('/metrics/stats'),
};

// Logs API
export const logsApi = {
  getLogs: (params?: {
    level?: string;
    service?: string;
    start?: string;
    end?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => api.get<{
    logs: LogEntry[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    timestamp: string;
  }>('/logs', { params }),
  
  submitLog: (log: Omit<LogEntry, 'id' | 'created_at'>) => 
    api.post('/logs', log),
  
  submitBulkLogs: (logs: Omit<LogEntry, 'id' | 'created_at'>[]) => 
    api.post('/logs/bulk', { logs }),
  
  getStats: () => api.get('/logs/stats'),
};

// Authentication API
export const authApi = {
  login: (credentials: LoginRequest) => 
    api.post<{ message: string } & AuthToken>('/auth/login', credentials),
  
  register: (userData: RegisterRequest) => 
    api.post<{ message: string; user: User }>('/auth/register', userData),
  
  getProfile: () => 
    api.get<{ user: User }>('/auth/profile'),
  
  getUsers: () => 
    api.get<{ users: User[]; count: number }>('/auth/users'),
  
  verify: () => 
    api.get<{ valid: boolean; user: any }>('/auth/verify'),
  
  logout: () => 
    api.post<{ message: string }>('/auth/logout'),
};

// Alerts API
export const alertsApi = {
  // Alert Rules
  getAlertRules: () => 
    api.get<{ rules: AlertRule[]; count: number }>('/alerts/rules'),
  
  getAlertRule: (id: number) => 
    api.get<{ rule: AlertRule }>(`/alerts/rules/${id}`),
  
  createAlertRule: (rule: Omit<AlertRule, 'id' | 'created_at' | 'updated_at' | 'created_by'>) => 
    api.post<{ rule: AlertRule; message: string }>('/alerts/rules', rule),
  
  updateAlertRule: (id: number, updates: Partial<AlertRule>) => 
    api.put<{ rule: AlertRule; message: string }>(`/alerts/rules/${id}`, updates),
  
  deleteAlertRule: (id: number) => 
    api.delete<{ message: string }>(`/alerts/rules/${id}`),
  
  // Alerts
  getAlerts: (params?: { status?: string; severity?: string }) => 
    api.get<{ alerts: Alert[]; count: number }>('/alerts', { params }),
  
  acknowledgeAlert: (id: number) => 
    api.post<{ message: string }>(`/alerts/${id}/acknowledge`),
  
  resolveAlert: (id: number) => 
    api.post<{ message: string }>(`/alerts/${id}/resolve`),
  
  // Notification Channels
  getNotificationChannels: () => 
    api.get<{ channels: NotificationChannel[]; count: number }>('/alerts/channels'),
  
  createNotificationChannel: (channel: Omit<NotificationChannel, 'id' | 'created_at'>) => 
    api.post<{ channel: NotificationChannel; message: string }>('/alerts/channels', channel),
  
  // Statistics and Evaluation
  getAlertStats: () => 
    api.get('/alerts/stats'),
  
  triggerEvaluation: () => 
    api.post<{ message: string }>('/alerts/evaluate'),
};

// Tracing API
export const tracingApi = {
  // Traces
  getTraces: (params?: {
    service?: string;
    operation?: string;
    status?: string;
    start?: string;
    end?: string;
    limit?: number;
  }) => api.get<{ traces: TraceData[]; count: number }>('/tracing', { params }),
  
  getTrace: (traceId: string) => 
    api.get<{ trace: TraceData }>(`/tracing/${traceId}`),
  
  getTraceSpans: (traceId: string) => 
    api.get<{ spans: TraceSpan[]; count: number }>(`/tracing/${traceId}/spans`),
  
  // Spans
  submitSpan: (span: Omit<TraceSpan, 'created_at'>) => 
    api.post<{ span: TraceSpan; message: string }>('/tracing/spans', span),
  
  submitSpans: (spans: Omit<TraceSpan, 'created_at'>[]) => 
    api.post<{ spans: TraceSpan[]; count: number; message: string }>('/tracing/spans/bulk', { spans }),
  
  // Dependencies
  getServiceDependencies: (service?: string) => 
    api.get<{ dependencies: ServiceDependency[]; count: number }>('/tracing/dependencies/services', {
      params: service ? { service } : {}
    }),
  
  // Statistics
  getTracingStats: () => 
    api.get('/tracing/stats/overview'),
};

export default api;