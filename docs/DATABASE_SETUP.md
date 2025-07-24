# Database Integration Guide

This guide explains how to set up and configure the databases for Argus monitoring platform.

## Overview

Argus uses multiple databases for different purposes:

- **InfluxDB**: Time-series data for metrics
- **Elasticsearch**: Log storage and search
- **PostgreSQL**: Metadata, configuration, users, and alerts
- **Redis**: Caching and session management

## Quick Start with Docker

The easiest way to set up all databases is using Docker Compose:

```bash
# Start all databases
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all databases
docker-compose -f docker-compose.dev.yml down
```

## Environment Configuration

Create a `.env` file in the backend directory with database connections:

```bash
# Copy the example file
cp backend/.env.example backend/.env

# Edit the file to include database URLs
INFLUXDB_URL=http://localhost:8086
INFLUXDB_TOKEN=argus-influxdb-token
INFLUXDB_ORG=argus
INFLUXDB_BUCKET=metrics

ELASTICSEARCH_URL=http://localhost:9200

DATABASE_URL=postgresql://postgres:password@localhost:5432/argus

REDIS_URL=redis://localhost:6379
```

## Individual Database Setup

### InfluxDB Setup

1. **Using Docker:**
   ```bash
   docker run -d -p 8086:8086 \
     -e DOCKER_INFLUXDB_INIT_MODE=setup \
     -e DOCKER_INFLUXDB_INIT_USERNAME=admin \
     -e DOCKER_INFLUXDB_INIT_PASSWORD=password123 \
     -e DOCKER_INFLUXDB_INIT_ORG=argus \
     -e DOCKER_INFLUXDB_INIT_BUCKET=metrics \
     -e DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=argus-influxdb-token \
     influxdb:2.7
   ```

2. **Manual Installation:**
   - Download and install InfluxDB 2.x from [official site](https://portal.influxdata.com/downloads/)
   - Create organization: `argus`
   - Create bucket: `metrics`
   - Generate token and add to environment variables

### Elasticsearch Setup

1. **Using Docker:**
   ```bash
   docker run -d -p 9200:9200 -p 9300:9300 \
     -e "discovery.type=single-node" \
     -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
     -e "xpack.security.enabled=false" \
     elasticsearch:8.11.0
   ```

2. **Manual Installation:**
   - Download and install Elasticsearch 8.x
   - Disable security for development: `xpack.security.enabled: false`
   - Start the service

### PostgreSQL Setup

1. **Using Docker:**
   ```bash
   docker run -d -p 5432:5432 \
     -e POSTGRES_DB=argus \
     -e POSTGRES_USER=postgres \
     -e POSTGRES_PASSWORD=password \
     postgres:15
   ```

2. **Manual Installation:**
   - Install PostgreSQL 15+
   - Create database: `argus`
   - Run initialization script: `docker/init-db.sql`

### Redis Setup

1. **Using Docker:**
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

2. **Manual Installation:**
   - Install Redis 6+
   - Start the service

## Fallback Behavior

If databases are not configured, Argus will fall back to in-memory storage:

- **Metrics**: Limited to 1,000 recent metrics
- **Logs**: Limited to 10,000 recent log entries
- **Configuration**: Basic configuration without persistence

This allows development and testing without database setup.

## Health Monitoring

Check database connectivity via the health endpoint:

```bash
curl http://localhost:3001/api/health
```

Response includes status for each database:
```json
{
  "services": {
    "api": "healthy",
    "database": "healthy",
    "cache": "healthy", 
    "influxdb": "healthy",
    "elasticsearch": "healthy"
  }
}
```

## Production Considerations

### Security
- Enable authentication for all databases
- Use strong passwords and rotate regularly
- Configure SSL/TLS encryption
- Implement network security groups

### Performance
- Configure appropriate resource limits
- Set up monitoring for database performance
- Implement backup strategies
- Consider clustering for high availability

### Scaling
- Use managed database services for production
- Implement read replicas for read-heavy workloads
- Consider sharding strategies for large datasets
- Monitor and optimize query performance

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if database services are running
   - Verify port accessibility
   - Check firewall settings

2. **Authentication Failed**
   - Verify credentials in environment variables
   - Check database user permissions
   - Ensure database exists

3. **Performance Issues**
   - Monitor database resource usage
   - Check query execution plans
   - Consider indexing strategies
   - Review retention policies

### Debug Mode

Enable debug logging for database operations:

```bash
LOG_LEVEL=debug npm run dev
```

This will show detailed database connection and query logs.