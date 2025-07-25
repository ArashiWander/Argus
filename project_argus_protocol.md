# Project Argus Protocol Specification

## Overview

Project Argus implements a multi-protocol data ingestion layer to support diverse monitoring and observability use cases. This document specifies the protocols supported and their implementation details.

## Supported Protocols

### 1. HTTP/HTTPS (REST API)
**Status**: ✅ Implemented  
**Use Case**: Web applications, services, and general-purpose integrations  
**Port**: 3001 (configurable)  

#### Endpoints
- `POST /api/metrics` - Submit metrics
- `POST /api/logs` - Submit logs  
- `POST /api/logs/bulk` - Submit multiple logs
- `GET /api/metrics` - Query metrics
- `GET /api/logs` - Query logs

#### Authentication
- JWT Bearer tokens
- API Key support (planned)

### 2. gRPC
**Status**: 🚧 To be implemented  
**Use Case**: High-performance applications, microservices, low-latency requirements  
**Port**: 50051 (configurable)

#### Services
- `MetricsService` - High-throughput metrics ingestion
- `LogsService` - Structured log ingestion
- `HealthService` - Service health checks

#### Features
- Binary serialization for efficiency
- Streaming support for real-time data
- Strong typing with Protocol Buffers
- Bidirectional streaming capabilities

### 3. MQTT
**Status**: 🚧 To be implemented  
**Use Case**: IoT devices, sensor networks, edge computing  
**Port**: 1883 (standard), 8883 (TLS)

#### Topics Structure
- `argus/metrics/{service}/{metric_name}` - Metrics publication
- `argus/logs/{service}/{level}` - Log publication
- `argus/health/{service}` - Health status
- `argus/commands/{service}` - Control commands

#### QoS Levels
- QoS 0: At most once delivery (sensor data)
- QoS 1: At least once delivery (important metrics)
- QoS 2: Exactly once delivery (critical alerts)

### 4. Apache Kafka
**Status**: 🚧 To be implemented  
**Use Case**: Stream processing, event sourcing, high-throughput data pipelines  
**Default Port**: 9092

#### Topics
- `argus-metrics` - Metrics stream
- `argus-logs` - Logs stream
- `argus-traces` - Distributed traces
- `argus-alerts` - Alert notifications

#### Partitioning Strategy
- Metrics: Partitioned by service name
- Logs: Partitioned by service and log level
- Traces: Partitioned by trace ID

## Protocol Selection Strategy

### Automatic Protocol Detection
The system automatically detects and routes requests based on:
1. **Port-based routing**: Different protocols on different ports
2. **Content-Type headers**: HTTP requests with specific content types
3. **Protocol headers**: Custom headers indicating preferred protocol

### Load Balancing
- **HTTP**: Standard HTTP load balancer
- **gRPC**: gRPC-aware load balancing with client-side discovery
- **MQTT**: Broker clustering with shared subscriptions
- **Kafka**: Consumer group balancing

## Data Format Specifications

### Metric Format
```json
{
  "name": "string",           // Metric name (e.g., "cpu.usage")
  "value": "number",          // Numeric value
  "timestamp": "ISO8601",     // Optional, defaults to current time
  "service": "string",        // Source service identifier
  "tags": {                   // Optional metadata
    "host": "string",
    "region": "string",
    "environment": "string"
  }
}
```

### Log Format
```json
{
  "level": "string",          // debug, info, warn, error, fatal
  "message": "string",        // Log message content
  "timestamp": "ISO8601",     // Optional, defaults to current time
  "service": "string",        // Source service identifier
  "tags": {                   // Optional metadata
    "request_id": "string",
    "user_id": "string",
    "trace_id": "string"
  }
}
```

## Protocol-Specific Implementations

### gRPC Implementation

#### Protocol Buffer Definitions
```protobuf
syntax = "proto3";

package argus.v1;

service MetricsService {
  rpc SubmitMetric(MetricRequest) returns (MetricResponse);
  rpc SubmitMetrics(stream MetricRequest) returns (MetricResponse);
  rpc QueryMetrics(MetricQuery) returns (stream MetricResponse);
}

service LogsService {
  rpc SubmitLog(LogRequest) returns (LogResponse);
  rpc SubmitLogs(stream LogRequest) returns (LogResponse);
  rpc QueryLogs(LogQuery) returns (stream LogResponse);
}

message MetricRequest {
  string name = 1;
  double value = 2;
  int64 timestamp = 3;
  string service = 4;
  map<string, string> tags = 5;
}

message LogRequest {
  string level = 1;
  string message = 2;
  int64 timestamp = 3;
  string service = 4;
  map<string, string> tags = 5;
}
```

### MQTT Implementation

#### Message Payload Format
- **JSON**: Default format for ease of use
- **Protocol Buffers**: Binary format for efficiency
- **MessagePack**: Compact binary format

#### Topic Examples
```
argus/metrics/web-server/cpu.usage
argus/logs/api-service/error
argus/health/database/status
```

#### Retained Messages
- Service health status messages are retained
- Latest configuration messages are retained
- Metric threshold configurations are retained

### Kafka Implementation

#### Producer Configuration
```json
{
  "bootstrap.servers": "localhost:9092",
  "key.serializer": "StringSerializer",
  "value.serializer": "JsonSerializer",
  "compression.type": "snappy",
  "batch.size": 16384,
  "linger.ms": 10
}
```

#### Consumer Configuration
```json
{
  "bootstrap.servers": "localhost:9092",
  "group.id": "argus-processors",
  "key.deserializer": "StringDeserializer",
  "value.deserializer": "JsonDeserializer",
  "enable.auto.commit": true,
  "auto.offset.reset": "earliest"
}
```

## Security Considerations

### Authentication & Authorization
- **HTTP**: JWT tokens, API keys
- **gRPC**: TLS client certificates, JWT metadata
- **MQTT**: Username/password, client certificates
- **Kafka**: SASL/SCRAM, mTLS

### Data Encryption
- **HTTP**: TLS 1.3 mandatory in production
- **gRPC**: TLS by default
- **MQTT**: TLS/SSL encryption
- **Kafka**: SSL encryption for data in transit

### Rate Limiting
- Per-protocol rate limiting
- Service-based quotas
- IP-based throttling
- Token bucket algorithms

## Performance Specifications

### Throughput Targets
- **HTTP**: 10,000 requests/second
- **gRPC**: 50,000 requests/second
- **MQTT**: 100,000 messages/second
- **Kafka**: 1,000,000 messages/second

### Latency Targets
- **HTTP**: <100ms P95
- **gRPC**: <50ms P95
- **MQTT**: <10ms P95
- **Kafka**: <5ms P95 (producer)

## Configuration

### Environment Variables
```bash
# HTTP Configuration
HTTP_PORT=3001
HTTP_ENABLED=true

# gRPC Configuration
GRPC_PORT=50051
GRPC_ENABLED=true
GRPC_TLS_ENABLED=false

# MQTT Configuration
MQTT_PORT=1883
MQTT_TLS_PORT=8883
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883

# Kafka Configuration
KAFKA_ENABLED=true
KAFKA_BROKERS=localhost:9092
KAFKA_TOPICS_PREFIX=argus
```

### Protocol Selection Rules
1. **Default**: HTTP REST API
2. **High-throughput**: gRPC for services requiring >1000 RPS
3. **IoT/Edge**: MQTT for device connectivity
4. **Stream Processing**: Kafka for event-driven architectures

## Implementation Phases

### Phase 1: Foundation ✅
- [x] HTTP REST API implementation
- [x] Basic data models and validation
- [x] Authentication and authorization

### Phase 2: gRPC Support 🚧
- [ ] Protocol buffer definitions
- [ ] gRPC server implementation
- [ ] Streaming support
- [ ] TLS configuration

### Phase 3: MQTT Support 🚧
- [ ] MQTT broker integration
- [ ] Topic management
- [ ] QoS handling
- [ ] Device authentication

### Phase 4: Kafka Integration 🚧
- [ ] Producer implementation
- [ ] Consumer groups
- [ ] Topic management
- [ ] Stream processing

### Phase 5: Optimization 🚧
- [ ] Protocol benchmarking
- [ ] Performance tuning
- [ ] Auto-scaling configuration
- [ ] Monitoring and alerting

## Monitoring and Observability

### Protocol-specific Metrics
- Request counts per protocol
- Latency distributions
- Error rates and types
- Connection pools status
- Message queue depths

### Health Checks
- Protocol-specific health endpoints
- Dependency health checks
- Performance degradation detection
- Automatic failover capabilities

## Client SDKs

### Planned SDKs
- **JavaScript/TypeScript**: HTTP, gRPC, MQTT
- **Python**: All protocols
- **Go**: gRPC, Kafka, HTTP
- **Java**: Kafka, gRPC, HTTP
- **C++**: MQTT, gRPC

### SDK Features
- Automatic protocol selection
- Connection pooling
- Retry logic with exponential backoff
- Circuit breaker patterns
- Metrics and tracing instrumentation

## Testing Strategy

### Protocol Testing
- Unit tests for each protocol handler
- Integration tests with real protocol clients
- Load testing for performance validation
- Security testing for authentication flows

### End-to-End Testing
- Multi-protocol data ingestion scenarios
- Protocol switching and failover
- Data consistency across protocols
- Performance regression testing

---

*This specification document will be updated as the implementation progresses and new requirements emerge.*