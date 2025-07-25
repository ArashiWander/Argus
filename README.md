# Argus Monitoring Platform

A comprehensive, production-ready monitoring and observability platform that provides real-time visibility into distributed systems, applications, and infrastructure through multiple communication protocols.

## 🚀 Quick Start

**New to Argus?** Get up and running in 2 minutes!

```bash
# 1. Clone the repository
git clone https://github.com/ArashiWander/Argus.git
cd Argus

# 2. Run the interactive setup wizard
./setup.sh

# 3. Start the platform
./start.sh
```

That's it! 🎉 Open http://localhost:3000 to access the dashboard.

### ⚡ Even Faster (One Command)
```bash
git clone https://github.com/ArashiWander/Argus.git && cd Argus && ./setup.sh && ./start.sh
```

### 🛠️ Using the CLI Helper
```bash
./argus start      # Start the platform
./argus status     # Check if running
./argus demo       # Add sample data
./argus logs       # View recent logs
./argus help       # See all commands
```

### 📦 Using npm scripts (alternative)
```bash
npm run setup      # Interactive setup wizard
npm run start      # Start the platform  
npm run demo       # Generate sample data
npm run health     # Health check
```

## 🚀 Current Status

**Production Ready** - Argus is actively developed with completed core features and advanced capabilities.

### ✅ Implemented Features

- **Multi-Protocol Support**: HTTP REST, gRPC, MQTT, and Kafka protocols all production-ready
- **Real-time Monitoring**: Continuous system health and performance visibility
- **Production Database Stack**: InfluxDB, Elasticsearch, PostgreSQL, and Redis integration
- **Advanced Dashboard**: React-based interface with real-time charts and statistics  
- **User Authentication**: JWT tokens with role-based access control
- **Alert System**: Complete alert rules, evaluation, and notification system
- **Performance Optimized**: Rate limiting, compression, and caching
- **Enterprise Ready**: Docker containerization with CI/CD pipelines
- **Migration Tools**: Comprehensive migration scripts and utilities

## 🏗️ Architecture

### Backend Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with comprehensive middleware
- **Storage**: 
  - **InfluxDB** - Time-series metrics data
  - **Elasticsearch** - Logs and full-text search
  - **PostgreSQL** - Metadata and configuration
  - **Redis** - Caching and session management
- **Protocols**: HTTP REST, gRPC, MQTT, Kafka
- **Features**: Health checks, error handling, structured logging, authentication

### Frontend Stack
- **Framework**: React with TypeScript
- **UI Library**: Material-UI components
- **State Management**: Redux Toolkit
- **Features**: Real-time dashboards, metrics visualization, log explorer, user management

### Infrastructure
- **Containerization**: Multi-stage Docker builds
- **Orchestration**: Docker Compose for development and production
- **CI/CD**: GitHub Actions with automated testing
- **Reverse Proxy**: Nginx for production deployment
- **Monitoring**: Built-in health checks and metrics

## 🔧 Alternative Setup Methods

### Prerequisites

- Node.js 18+
- Docker and Docker Compose (optional)
- Git

### Manual Development Setup

If you prefer manual setup over the wizard:

1. **Clone and Setup**
   ```bash
   git clone https://github.com/ArashiWander/Argus.git
   cd Argus
   ```

2. **Configure Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your preferred settings
   npm run build
   cd ..
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Start Services**
   ```bash
   # Option 1: Use our enhanced startup script
   ./start.sh
   
   # Option 2: Start manually
   cd backend && npm run dev &
   cd frontend && npm start &
   ```

### 🐳 Docker Setup

```bash
# Start with databases (recommended)
docker-compose -f docker-compose.dev.yml up -d

# Or full production stack
docker-compose up -d --build
```

### 🏥 Health Check

```bash
# Check if everything is running
./health-check.sh

# Or manually
curl http://localhost:3001/api/health
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

### Production Deployment

```bash
# Build and deploy full production stack
docker-compose up -d --build

# Scale application instances
docker-compose up -d --scale argus-app=3

# View logs
docker-compose logs -f argus-app
```

## 🔌 Multi-Protocol API

### Protocol Status

| Protocol | Port | Status | Use Case |
|----------|------|--------|----------|
| **HTTP REST** | 3001 | ✅ Production | Web apps, general integration |
| **gRPC** | 50051 | ✅ Production | High-performance microservices |
| **MQTT** | 1883 | ✅ Production | IoT devices, edge computing |
| **Kafka** | 9092 | ✅ Production | Stream processing, event-driven |

### Protocol Configuration

```bash
# Enable all protocols in .env
GRPC_ENABLED=true
GRPC_PORT=50051
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

### API Examples

#### HTTP REST
```bash
# Submit metrics
POST /api/metrics
{
  "name": "cpu.usage",
  "value": 75.5,
  "service": "web-server",
  "tags": {"host": "server-1"}
}

# Query logs
GET /api/logs?level=error&service=api&search=database
```

#### gRPC Client (Node.js)
```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const packageDefinition = protoLoader.loadSync('proto/argus.proto');
const argus = grpc.loadPackageDefinition(packageDefinition).argus.v1;

const client = new argus.MetricsService('localhost:50051', 
  grpc.credentials.createInsecure());

client.SubmitMetric({
  name: 'response.time',
  value: 120.5,
  service: 'api-gateway'
}, (error, response) => {
  console.log('Metric submitted:', response);
});
```

#### MQTT Publisher
```javascript
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

// Publish metrics
client.publish('argus/metrics/web-server/cpu.usage', JSON.stringify({
  name: 'cpu.usage',
  value: 75.5,
  service: 'web-server',
  timestamp: new Date().toISOString()
}));
```

#### Kafka Producer
```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'monitoring-client',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

await producer.send({
  topic: 'argus-metrics',
  messages: [{
    key: 'web-server',
    value: JSON.stringify({
      name: 'memory.usage',
      value: 68.2,
      service: 'web-server'
    })
  }]
});
```

## 🔧 Configuration

### Environment Variables

```bash
# Application
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

# Database URLs
DATABASE_URL=postgresql://username:password@localhost:5432/argus
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=your-influxdb-token
INFLUXDB_ORG=argus
INFLUXDB_BUCKET=metrics
ELASTICSEARCH_URL=http://localhost:9200
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=24h

# Protocols
GRPC_ENABLED=true
GRPC_PORT=50051
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
```

## 📁 Project Structure

```
Argus/
├── backend/                    # Node.js/TypeScript API server
│   ├── src/
│   │   ├── routes/            # API routes (metrics, logs, auth, alerts)
│   │   ├── middleware/        # Authentication, error handling, logging
│   │   ├── services/          # Business logic and protocol handlers
│   │   ├── models/            # Database models and schemas
│   │   ├── config/            # Application configuration
│   │   └── server.ts          # Main server with multi-protocol support
│   ├── proto/                 # gRPC protocol definitions
│   └── package.json
├── frontend/                   # React/TypeScript web application
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Application pages (dashboard, logs, alerts)
│   │   ├── services/          # API service layer
│   │   ├── store/             # Redux store with authentication
│   │   └── types/             # TypeScript definitions
│   └── package.json
├── scripts/                    # Migration and utility scripts
│   ├── migrate.sh             # Database migration utility
│   ├── config-migrate.sh      # Configuration migration
│   └── validate-migration.sh  # Post-migration validation
├── docs/                       # Comprehensive documentation
├── docker/                     # Docker configuration files
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Production orchestration
├── docker-compose.dev.yml      # Development with databases
└── docker-compose.full.yml     # Complete stack with all protocols
```

## 🛠️ Development Commands

### Backend
```bash
npm run dev         # Development server with hot reload
npm run build       # Build TypeScript to JavaScript
npm run start       # Production server
npm run lint        # ESLint code quality check
npm run test        # Run test suite
```

### Frontend
```bash
npm start           # Development server with hot reload
npm run build       # Production build
npm run lint        # ESLint and code quality
npm test            # Run test suite
```

## 🔄 Migration and Maintenance

The project includes comprehensive migration tools for database updates and configuration changes:

```bash
# Check system health before migration
./scripts/migrate.sh check-health

# Create backups
./scripts/migrate.sh backup-postgres
./scripts/migrate.sh backup-influxdb

# Run migration
./scripts/migrate.sh migrate 4

# Validate migration results
./scripts/validate-migration.sh full
```

See [Migration Scripts Documentation](scripts/README.md) for detailed usage.

## 📚 Documentation & Help

### 📖 Getting Started
- **[Quick Start Guide](#-quick-start)** - Get running in 2 minutes
- **[Setup Troubleshooting](#-troubleshooting)** - Common issues and solutions
- **[Development Guide](docs/DEVELOPMENT.md)** - Detailed development setup

### 📋 Technical Documentation  
- **[Database Setup Guide](docs/DATABASE_SETUP.md)** - Complete database configuration
- **[Protocol Documentation](docs/PROTOCOLS.md)** - Multi-protocol usage examples
- **[API Documentation](docs/api-documentation.yaml)** - OpenAPI specification
- **[Migration Guide](project_argus_migration.md)** - Migration procedures and best practices

### 🔧 Tools & Scripts
- `./setup.sh` - Interactive setup wizard with multiple modes
- `./argus` - **CLI helper for all common tasks**
- `./start.sh` - Enhanced startup script with better error handling
- `./health-check.sh` - System health validation and diagnostics
- `./demo.sh` - Generate realistic sample data with progress indicators
- `./start-dev.sh` - Original development startup script

## 🆘 Troubleshooting

### Common Issues

**❌ "Node.js version error"**
```bash
# Install Node.js 18+ from nodejs.org
node --version  # Should be 18.0.0 or higher
```

**❌ "Port already in use"**
```bash
# Kill processes using the ports
lsof -ti:3000,3001 | xargs kill -9
# Or change ports in backend/.env
```

**❌ "Backend health check failed"**
```bash
# Check backend logs
cd backend && npm run dev
# Verify environment configuration
cat backend/.env
```

**❌ "Database connection failed"**
```bash
# Start database services with Docker
docker-compose -f docker-compose.dev.yml up -d
# Or disable external databases (uses in-memory storage)
# Comment out database URLs in backend/.env
```

**❌ "Permission denied on scripts"**
```bash
chmod +x setup.sh start.sh health-check.sh demo.sh
```

### Getting Help

1. **Run diagnostics**: `./health-check.sh`
2. **Check logs**: Look in backend console output
3. **Verify setup**: Re-run `./setup.sh` and choose "Custom Setup"
4. **Reset environment**: Delete `backend/.env` and re-run setup
5. **Create issue**: [GitHub Issues](https://github.com/ArashiWander/Argus/issues) with diagnostic output

### 💡 Pro Tips

- **First time?** Use the setup wizard: `./setup.sh`
- **Development?** Choose "Developer Mode" in setup for all features
- **Production?** Use "Production Mode" and configure external databases
- **Quick test?** Run `./demo.sh` after starting to see sample data

## 🎯 Roadmap Status

### Phase 1 ✅ Complete
- [x] Project infrastructure and core API
- [x] Basic web interface and Docker containerization
- [x] CI/CD pipeline setup

### Phase 2 ✅ Complete  
- [x] Full database integration (InfluxDB, Elasticsearch, PostgreSQL, Redis)
- [x] Advanced dashboard with real-time features
- [x] User authentication and role-based access control
- [x] Complete alert system with notifications
- [x] Performance optimizations and rate limiting

### Phase 3 🚧 In Progress
- [ ] Distributed tracing with OpenTelemetry integration
- [ ] AI-powered anomaly detection algorithms  
- [ ] Mobile application for monitoring on-the-go
- [ ] Plugin architecture for custom extensions
- [ ] Advanced service dependency mapping

### Phase 4 🔄 Planned
- [ ] Multi-tenant architecture support
- [ ] Advanced analytics and reporting
- [ ] Machine learning-based predictive monitoring
- [ ] Enterprise integrations (LDAP, SAML, etc.)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🚀 Production Deployment Notes

- **Scalability**: Tested with multiple application instances and load balancing
- **Security**: JWT authentication, role-based access control, input validation
- **Monitoring**: Built-in health checks, metrics, and logging
- **Reliability**: Automatic failover, data persistence, backup procedures
- **Performance**: Optimized database queries, caching, compression

---

*Argus Monitoring Platform - Built for modern infrastructure monitoring needs.*
