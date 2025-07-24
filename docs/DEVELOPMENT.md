# Argus Development Guide

## Getting Started for Developers

This guide will help you set up the development environment and understand the codebase structure.

## Development Environment Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git
- Docker (optional, for full stack testing)

### Step-by-Step Setup

1. **Clone and navigate to the project**
   ```bash
   git clone https://github.com/ArashiWander/Argus.git
   cd Argus
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env file if needed
   npm run dev
   ```

3. **Frontend Setup (new terminal)**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Verify Setup**
   - Backend health check: `curl http://localhost:3001/api/health`
   - Frontend: Open `http://localhost:3000` in browser

## Architecture Overview

### Backend Architecture
```
backend/src/
├── server.ts              # Main application entry point
├── config/
│   └── logger.ts          # Winston logging configuration
├── middleware/
│   └── errorHandler.ts    # Global error handling
├── routes/
│   ├── health.ts          # Health check endpoints
│   ├── metrics.ts         # Metrics CRUD operations
│   └── logs.ts            # Logs CRUD operations
├── services/              # Business logic (future)
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions (future)
```

### Frontend Architecture
```
frontend/src/
├── App.tsx                # Main application component
├── index.tsx              # Application entry point
├── components/
│   └── Navbar.tsx         # Navigation component
├── pages/
│   ├── Dashboard.tsx      # Main dashboard
│   ├── Metrics.tsx        # Metrics management
│   └── Logs.tsx           # Logs management
├── services/
│   └── api.ts             # API service layer
├── store/
│   └── store.ts           # Redux store configuration
└── types/
    └── index.ts           # TypeScript interfaces
```

## API Reference

### Authentication
Currently, no authentication is implemented. This will be added in Phase 2.

### Health Endpoints

#### GET /api/health
Returns system health status.

**Response:**
```json
{
  "uptime": 3600,
  "message": "OK",
  "timestamp": "2023-07-24T12:00:00.000Z",
  "env": "development",
  "version": "1.0.0",
  "services": {
    "api": "healthy",
    "database": "not_connected",
    "cache": "not_connected"
  }
}
```

#### GET /api/health/ready
Readiness probe for Kubernetes deployments.

#### GET /api/health/live
Liveness probe for Kubernetes deployments.

### Metrics Endpoints

#### GET /api/metrics
Retrieve metrics with optional filtering.

**Query Parameters:**
- `start` - ISO timestamp (filter by start time)
- `end` - ISO timestamp (filter by end time)
- `service` - Service name filter
- `metric_name` - Metric name filter

**Response:**
```json
{
  "metrics": [
    {
      "id": "1234567890",
      "name": "cpu.usage",
      "value": 75.5,
      "timestamp": "2023-07-24T12:00:00.000Z",
      "tags": {"host": "server-1"},
      "service": "web-server",
      "created_at": "2023-07-24T12:00:00.000Z"
    }
  ],
  "count": 1,
  "timestamp": "2023-07-24T12:00:00.000Z"
}
```

#### POST /api/metrics
Submit a new metric.

**Request Body:**
```json
{
  "name": "cpu.usage",
  "value": 75.5,
  "service": "web-server",
  "timestamp": "2023-07-24T12:00:00.000Z",
  "tags": {"host": "server-1", "region": "us-east-1"}
}
```

#### GET /api/metrics/stats
Get metrics statistics.

**Response:**
```json
{
  "total_metrics": 1500,
  "unique_services": 5,
  "unique_metric_names": 25,
  "oldest_metric": "2023-07-24T10:00:00.000Z",
  "newest_metric": "2023-07-24T12:00:00.000Z"
}
```

### Logs Endpoints

#### GET /api/logs
Retrieve logs with filtering and pagination.

**Query Parameters:**
- `level` - Log level filter (debug, info, warn, error, fatal)
- `service` - Service name filter
- `start` - ISO timestamp (filter by start time)
- `end` - ISO timestamp (filter by end time)
- `search` - Search term for message content
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 100)

**Response:**
```json
{
  "logs": [
    {
      "id": "1234567890",
      "level": "error",
      "message": "Database connection failed",
      "service": "api",
      "timestamp": "2023-07-24T12:00:00.000Z",
      "tags": {"user_id": "123"},
      "created_at": "2023-07-24T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total": 1500,
    "pages": 15
  },
  "timestamp": "2023-07-24T12:00:00.000Z"
}
```

#### POST /api/logs
Submit a new log entry.

**Request Body:**
```json
{
  "level": "error",
  "message": "Database connection failed",
  "service": "api",
  "timestamp": "2023-07-24T12:00:00.000Z",
  "tags": {"user_id": "123", "request_id": "req-456"}
}
```

#### POST /api/logs/bulk
Submit multiple log entries.

**Request Body:**
```json
{
  "logs": [
    {
      "level": "info",
      "message": "Request started",
      "service": "api"
    },
    {
      "level": "info", 
      "message": "Request completed",
      "service": "api"
    }
  ]
}
```

#### GET /api/logs/stats
Get logs statistics.

**Response:**
```json
{
  "total_logs": 10000,
  "unique_services": 8,
  "level_distribution": {
    "debug": 1000,
    "info": 7000,
    "warn": 1500,
    "error": 450,
    "fatal": 50
  },
  "oldest_log": "2023-07-24T10:00:00.000Z",
  "newest_log": "2023-07-24T12:00:00.000Z"
}
```

## Data Models

### Metric Interface
```typescript
interface Metric {
  id: string;                    // Unique identifier
  name: string;                  // Metric name (e.g., "cpu.usage")
  value: number;                 // Numeric value
  timestamp: string;             // ISO timestamp
  tags: Record<string, string>;  // Key-value metadata
  service: string;               // Source service name
  created_at: string;            // Creation timestamp
}
```

### Log Entry Interface
```typescript
interface LogEntry {
  id: string;                    // Unique identifier
  level: string;                 // Log level (debug, info, warn, error, fatal)
  message: string;               // Log message content
  service: string;               // Source service name
  timestamp: string;             // ISO timestamp
  tags: Record<string, string>;  // Key-value metadata
  created_at: string;            // Creation timestamp
}
```

## Development Workflow

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Backend changes: Edit files in `backend/src/`
   - Frontend changes: Edit files in `frontend/src/`

3. **Test your changes**
   ```bash
   # Backend testing
   cd backend
   npm run lint
   npm run build
   npm test

   # Frontend testing
   cd frontend
   npm run lint
   npm run build
   npm test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "Add your feature description"
   git push origin feature/your-feature-name
   ```

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Configured for both frontend and backend
- **Prettier**: Code formatting (configure in your IDE)
- **Naming**: camelCase for variables, PascalCase for components/classes

### Testing

#### Backend Testing
```bash
cd backend
npm test                    # Run all tests
npm test -- --watch        # Run in watch mode
npm test -- --coverage     # Run with coverage
```

#### Frontend Testing
```bash
cd frontend
npm test                    # Run all tests
npm test -- --coverage     # Run with coverage
npm test -- --watchAll     # Run in watch mode
```

### Docker Development

#### Build and test locally
```bash
docker build -t argus:dev .
docker run -p 3001:3001 argus:dev
```

#### Full stack with dependencies
```bash
docker-compose -f docker-compose.yml up --build
```

## Debugging

### Backend Debugging
1. **Logs**: Check `backend/logs/` directory
2. **Debug mode**: Set `LOG_LEVEL=debug` in `.env`
3. **VS Code**: Use the built-in debugger with the backend configuration

### Frontend Debugging
1. **Browser DevTools**: React Developer Tools extension
2. **Console logs**: Check browser console
3. **Network**: Monitor API calls in Network tab

### API Testing
```bash
# Health check
curl http://localhost:3001/api/health

# Submit metric
curl -X POST http://localhost:3001/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"name":"test.metric","value":100,"service":"test"}'

# Submit log
curl -X POST http://localhost:3001/api/logs \
  -H "Content-Type: application/json" \
  -d '{"level":"info","message":"Test log","service":"test"}'
```

## Performance Considerations

### Current Limitations (Phase 1)
- **In-memory storage**: Limited to available RAM
- **No persistence**: Data lost on restart
- **Single instance**: No horizontal scaling yet

### Future Improvements (Phase 2+)
- **Database integration**: InfluxDB for metrics, Elasticsearch for logs
- **Caching layer**: Redis for improved performance
- **Horizontal scaling**: Load balancing and clustering
- **Data retention**: Configurable retention policies

## Contributing Guidelines

1. **Follow the existing code style**
2. **Write tests for new features**
3. **Update documentation**
4. **Keep commits focused and descriptive**
5. **Ensure CI/CD pipeline passes**

## Next Steps

### Immediate Priorities
1. **Database Integration**: Replace in-memory storage
2. **Authentication**: Add user management
3. **Real-time Updates**: WebSocket implementation
4. **Dashboards**: Advanced visualization features
5. **Alerting**: Notification system

### Phase 2 Features
- User authentication and authorization
- Advanced dashboard builder
- Alert configuration and management
- Data retention policies
- Performance monitoring and metrics
- Plugin architecture for extensibility

## Support

For development questions or issues:
1. Check existing GitHub issues
2. Create a new issue with detailed description
3. Include environment details and reproduction steps