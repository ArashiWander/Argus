import axios from 'axios';
import { Metric, LogEntry, HealthStatus } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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

export default api;