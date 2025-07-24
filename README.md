# Argus Monitoring Platform

A comprehensive monitoring and observability platform designed to provide real-time visibility into distributed systems, applications, and infrastructure.

## Features

- **Real-time Monitoring**: Continuous visibility into system health and performance
- **Metrics Collection**: Custom metrics submission and visualization
- **Log Management**: Centralized log aggregation with search and filtering
- **RESTful API**: Complete API for metrics and logs submission
- **Modern UI**: React-based web interface with Material-UI components
- **Containerized**: Docker support for easy deployment
- **Scalable**: Built for growth from small to enterprise deployments

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose (optional, for containerized deployment)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArashiWander/Argus.git
   cd Argus
   ```

2. **Start Backend Service**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run dev
   ```
   Backend will be available at `http://localhost:3001`

3. **Start Frontend (in a new terminal)**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   Frontend will be available at `http://localhost:3000`

### Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d --build
```

The application will be available at `http://localhost`

## API Documentation

### Health Check
```bash
GET /api/health
```

### Metrics
```bash
# Get metrics
GET /api/metrics?service=web-server&start=2023-01-01T00:00:00Z

# Submit metric
POST /api/metrics
{
  "name": "cpu.usage",
  "value": 75.5,
  "service": "web-server",
  "tags": {"host": "server-1"}
}

# Get metrics statistics
GET /api/metrics/stats
```

### Logs
```bash
# Get logs
GET /api/logs?level=error&service=api&search=database

# Submit log
POST /api/logs
{
  "level": "error",
  "message": "Database connection failed",
  "service": "api",
  "tags": {"user_id": "123"}
}

# Submit bulk logs
POST /api/logs/bulk
{
  "logs": [
    {
      "level": "info",
      "message": "Request processed",
      "service": "api"
    }
  ]
}
```

## Architecture

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Storage**: In-memory (development), will expand to InfluxDB, Elasticsearch, PostgreSQL
- **Features**: RESTful API, health checks, error handling, logging

### Frontend
- **Framework**: React with TypeScript
- **UI Library**: Material-UI
- **State Management**: Redux Toolkit
- **Features**: Dashboard, metrics viewer, log explorer, real-time updates

### Infrastructure
- **Containerization**: Docker with multi-stage builds
- **Orchestration**: Docker Compose for local development
- **CI/CD**: GitHub Actions for automated testing and deployment
- **Reverse Proxy**: Nginx for production deployment

## Project Structure

```
Argus/
├── backend/                 # Node.js/TypeScript API server
│   ├── src/
│   │   ├── routes/         # API routes (health, metrics, logs)
│   │   ├── middleware/     # Error handling, logging
│   │   ├── config/         # Application configuration
│   │   └── server.ts       # Main server file
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React/TypeScript web application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Application pages
│   │   ├── services/       # API service layer
│   │   ├── types/          # TypeScript type definitions
│   │   └── store/          # Redux store configuration
│   ├── package.json
│   └── tsconfig.json
├── docker/                 # Docker configuration files
├── docs/                   # Documentation
├── .github/workflows/      # CI/CD workflows
├── docker-compose.yml      # Multi-service orchestration
├── Dockerfile              # Production container build
└── project_argus_blueprint.md  # Detailed project specification
```

## Development Commands

### Backend
```bash
npm run dev         # Start development server with hot reload
npm run build       # Build TypeScript to JavaScript
npm run start       # Start production server
npm run lint        # Run ESLint
npm run test        # Run tests
```

### Frontend
```bash
npm start           # Start development server
npm run build       # Build for production
npm run lint        # Run ESLint
npm test            # Run tests
```

## Deployment

### Production Environment Variables

Create `.env` file in backend directory:
```bash
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
FRONTEND_URL=http://localhost:3000

# Database URLs (when implemented)
# DATABASE_URL=postgresql://username:password@localhost:5432/argus
# INFLUXDB_URL=http://localhost:8086
# ELASTICSEARCH_URL=http://localhost:9200
# REDIS_URL=redis://localhost:6379
```

### Docker Production Deployment

1. **Build and deploy**
   ```bash
   docker-compose -f docker-compose.yml up -d --build
   ```

2. **View logs**
   ```bash
   docker-compose logs -f argus-app
   ```

3. **Scale services**
   ```bash
   docker-compose up -d --scale argus-app=3
   ```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Roadmap

See [project_argus_blueprint.md](project_argus_blueprint.md) for the complete roadmap and implementation plan.

### Phase 1 (Current) ✅
- Basic project infrastructure
- Core API endpoints for metrics and logs
- Web interface for data visualization
- Docker containerization
- CI/CD pipeline

### Phase 2 (Next)
- Database integration (InfluxDB, Elasticsearch, PostgreSQL)
- Advanced dashboard features
- User authentication
- Alert system
- Performance optimizations