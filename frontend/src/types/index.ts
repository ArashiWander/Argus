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