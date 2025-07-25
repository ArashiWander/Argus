# Argus Monitoring Platform

A comprehensive monitoring and observability platform designed to provide real-time visibility into distributed systems, applications, and infrastructure.

## Features

- **Multi-Protocol Support**: HTTP REST, gRPC, MQTT, and Kafka protocols
- **Real-time Monitoring**: Continuous visibility into system health and performance
- **Metrics Collection**: Custom metrics submission and visualization
- **Log Management**: Centralized log aggregation with search and filtering
- **High-Performance Ingestion**: gRPC for high-throughput scenarios
- **IoT Device Support**: MQTT protocol for edge and IoT devices
- **Stream Processing**: Kafka integration for event-driven architectures
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

### Database Setup (Optional)

For production-like experience with persistent storage:

1. **Start databases with Docker Compose**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Configure environment variables**
   ```bash
   cd backend
   # Edit .env file to include database URLs
   INFLUXDB_URL=http://localhost:8086
   ELASTICSEARCH_URL=http://localhost:9200
   DATABASE_URL=postgresql://postgres:password@localhost:5432/argus
   REDIS_URL=redis://localhost:6379
   ```

3. **Restart backend**
   ```bash
   npm run dev
   ```

See [Database Setup Guide](docs/DATABASE_SETUP.md) for detailed instructions.

### Multi-Protocol Configuration

Enable additional protocols by setting environment variables:

```bash
cd backend
# Copy environment template
cp .env.example .env

# Enable gRPC (high-performance)
GRPC_ENABLED=true
GRPC_PORT=50051

# Enable MQTT (IoT devices) - requires MQTT broker
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883

# Enable Kafka (stream processing) - requires Kafka cluster
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

For complete multi-protocol setup with all dependencies:

```bash
# Start full stack including MQTT broker and Kafka
docker-compose -f docker-compose.full.yml up -d
```

See [Protocol Documentation](docs/PROTOCOLS.md) for detailed usage examples.

### Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Start in background
docker-compose up -d --build
```

The application will be available at `http://localhost`

## API Documentation

### Supported Protocols

| Protocol | Port | Status | Use Case |
|----------|------|--------|----------|
| **HTTP REST** | 3001 | ✅ Production | Web apps, general purpose |
| **gRPC** | 50051 | ✅ Production | High-performance, microservices |
| **MQTT** | 1883 | ✅ Production | IoT devices, edge computing |
| **Kafka** | 9092 | ✅ Production | Stream processing, events |

### Health Check
```bash
GET /api/health
```

Response includes protocol status:
```json
{
  "protocols": {
    "http": { "status": "healthy", "port": 3001 },
    "grpc": { "status": "healthy", "port": 50051 },
    "mqtt": { "status": "healthy", "brokerUrl": "mqtt://localhost:1883" },
    "kafka": { "status": "healthy", "brokers": ["localhost:9092"] }
  }
}
```

### HTTP REST Examples

#### Metrics
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

### gRPC Client Examples

```javascript
// Node.js gRPC client
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('proto/argus.proto');
const argus = grpc.loadPackageDefinition(packageDefinition).argus.v1;

const client = new argus.MetricsService('localhost:50051', 
  grpc.credentials.createInsecure());

// Submit metric via gRPC
client.SubmitMetric({
  name: 'cpu.usage',
  value: 75.5,
  service: 'web-server'
}, (error, response) => {
  console.log('gRPC Response:', response);
});
```

### MQTT Client Examples

```javascript
// Node.js MQTT client
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

// Submit metric via MQTT
client.publish('argus/metrics/web-server/cpu.usage', JSON.stringify({
  name: 'cpu.usage',
  value: 75.5,
  service: 'web-server',
  tags: { host: 'server-1' }
}));

// Submit log via MQTT
client.publish('argus/logs/api-service/error', JSON.stringify({
  level: 'error',
  message: 'Database connection failed',
  service: 'api-service'
}));
```

### Kafka Producer Examples

```javascript
// Node.js Kafka producer
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

await producer.send({
  topic: 'argus-metrics',
  messages: [{
    key: 'web-server',
    value: JSON.stringify({
      name: 'cpu.usage',
      value: 75.5,
      service: 'web-server'
    })
  }]
});
```

See [Protocol Documentation](docs/PROTOCOLS.md) for complete examples and usage patterns.
```

## Architecture

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Storage**: 
  - **InfluxDB** for time-series metrics data
  - **Elasticsearch** for logs and search
  - **PostgreSQL** for metadata and configuration
  - **Redis** for caching and session management
  - In-memory fallback for development without databases
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

# Database URLs
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-influxdb-token
INFLUXDB_ORG=argus
INFLUXDB_BUCKET=metrics

ELASTICSEARCH_URL=http://localhost:9200
DATABASE_URL=postgresql://username:password@localhost:5432/argus
REDIS_URL=redis://localhost:6379
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

### Phase 1 ✅
- [x] Basic project infrastructure
- [x] Core API endpoints for metrics and logs
- [x] Web interface for data visualization
- [x] Docker containerization
- [x] CI/CD pipeline

### Phase 2 ✅
- [x] Database integration (InfluxDB, Elasticsearch, PostgreSQL, Redis)
- [x] Enhanced health monitoring with database status
- [x] Fallback to in-memory storage for development
- [x] Advanced dashboard features with real-time charts and statistics
- [x] User authentication with JWT tokens and role-based access control
- [x] Complete alert system with rules, evaluation, and notifications
- [x] Performance optimizations with rate limiting and compression

### Phase 3 (In Progress) 🚧
- [ ] Distributed tracing with OpenTelemetry integration
- [ ] Anomaly detection algorithms
- [ ] Mobile application
- [ ] Plugin architecture for extensibility
- [ ] Advanced visualization features with service dependency mapping