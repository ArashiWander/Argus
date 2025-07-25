# Client Examples and Usage Guide

This directory contains client examples for all supported protocols in the Argus monitoring platform.

## Protocol Support Matrix

| Protocol | Port | Status | Use Case |
|----------|------|--------|----------|
| HTTP REST | 3001 | ✅ Production Ready | Web apps, general purpose |
| gRPC | 50051 | ✅ Production Ready | High-performance, microservices |
| MQTT | 1883/8883 | ✅ Production Ready | IoT devices, edge computing |
| Kafka | 9092 | ✅ Production Ready | Stream processing, event sourcing |

## Quick Start

### HTTP REST API

```bash
# Submit a metric
curl -X POST http://localhost:3001/api/metrics \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cpu.usage",
    "value": 75.5,
    "service": "web-server",
    "tags": {"host": "server-1"}
  }'

# Submit a log
curl -X POST http://localhost:3001/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "level": "error",
    "message": "Database connection failed",
    "service": "api-service"
  }'
```

### gRPC Client (Node.js)

```javascript
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// Load proto definition
const packageDefinition = protoLoader.loadSync('proto/argus.proto');
const argus = grpc.loadPackageDefinition(packageDefinition).argus.v1;

// Create client
const client = new argus.MetricsService('localhost:50051', 
  grpc.credentials.createInsecure());

// Submit metric
client.SubmitMetric({
  name: 'memory.usage',
  value: 1024.0,
  service: 'api-server',
  tags: { region: 'us-east-1' }
}, (error, response) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success:', response);
  }
});
```

### MQTT Client (Node.js)

```javascript
const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', () => {
  // Submit metric
  client.publish('argus/metrics/api-server/cpu.usage', JSON.stringify({
    name: 'cpu.usage',
    value: 65.5,
    service: 'api-server',
    tags: { host: 'prod-1' }
  }));

  // Submit log
  client.publish('argus/logs/api-server/error', JSON.stringify({
    level: 'error',
    message: 'Failed to process request',
    service: 'api-server'
  }));
});
```

### Kafka Producer (Node.js)

```javascript
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092']
});

const producer = kafka.producer();

async function sendMetric() {
  await producer.connect();
  
  await producer.send({
    topic: 'argus-metrics',
    messages: [{
      key: 'api-server',
      value: JSON.stringify({
        name: 'response.time',
        value: 125.0,
        service: 'api-server',
        timestamp: Date.now()
      })
    }]
  });
  
  await producer.disconnect();
}
```

## Protocol Selection Guide

### When to use HTTP REST
- **Web applications** and browser-based clients
- **General-purpose integrations** with existing systems
- **Development and testing** due to simplicity
- **Human-readable APIs** and debugging

### When to use gRPC
- **High-throughput applications** (>1000 RPS)
- **Microservices** with strong typing requirements
- **Real-time streaming** of metrics or logs
- **Language-agnostic** service communication

### When to use MQTT
- **IoT devices** and sensor networks
- **Edge computing** with intermittent connectivity
- **Publish/subscribe** messaging patterns
- **Low-bandwidth** environments

### When to use Kafka
- **Event-driven architectures** and stream processing
- **High-volume data ingestion** (>10K messages/sec)
- **Event sourcing** and audit trails
- **Multiple consumer** scenarios

## Performance Characteristics

| Protocol | Latency | Throughput | Resource Usage | Complexity |
|----------|---------|------------|----------------|------------|
| HTTP | ~100ms P95 | 10K req/sec | Medium | Low |
| gRPC | ~50ms P95 | 50K req/sec | Low | Medium |
| MQTT | ~10ms P95 | 100K msg/sec | Very Low | Medium |
| Kafka | ~5ms P95 | 1M msg/sec | High | High |

## Configuration

Enable protocols via environment variables:

```bash
# Enable all protocols
HTTP_ENABLED=true
GRPC_ENABLED=true
MQTT_ENABLED=true
KAFKA_ENABLED=true

# Configure ports
HTTP_PORT=3001
GRPC_PORT=50051
MQTT_BROKER_URL=mqtt://localhost:1883
KAFKA_BROKERS=localhost:9092
```

## Security Configuration

### TLS/SSL Support

```bash
# gRPC with TLS
GRPC_TLS_ENABLED=true

# MQTT with TLS
MQTT_BROKER_URL=mqtts://localhost:8883

# Kafka with SSL
KAFKA_SSL_ENABLED=true
```

### Authentication

All protocols support JWT-based authentication:

```javascript
// HTTP
const response = await fetch('/api/metrics', {
  headers: {
    'Authorization': 'Bearer ' + token,
    'Content-Type': 'application/json'
  }
});

// gRPC
const metadata = new grpc.Metadata();
metadata.add('authorization', 'Bearer ' + token);
client.SubmitMetric(request, metadata, callback);
```

## Monitoring and Observability

Check protocol health status:

```bash
curl http://localhost:3001/api/health
```

Response includes protocol-specific status:

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

## Troubleshooting

### Common Issues

1. **Protocol not starting**
   - Check environment variables
   - Verify port availability
   - Check service dependencies (MQTT broker, Kafka cluster)

2. **Connection refused**
   - Ensure services are running
   - Check firewall settings
   - Verify network connectivity

3. **Authentication failures**
   - Validate JWT tokens
   - Check token expiration
   - Verify service permissions

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug npm run dev
```

This provides detailed information about protocol operations and message processing.

## Examples Repository

Complete working examples are available in the `/examples` directory:

- `/examples/http-client/` - HTTP REST API examples
- `/examples/grpc-client/` - gRPC client examples  
- `/examples/mqtt-client/` - MQTT client examples
- `/examples/kafka-client/` - Kafka producer/consumer examples
- `/examples/load-test/` - Performance testing scripts

Each example includes:
- Client implementation
- Authentication setup
- Error handling
- Performance optimization tips