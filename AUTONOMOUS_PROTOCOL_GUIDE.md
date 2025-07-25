# Argus Autonomous Protocol Implementation Guide

This document provides a comprehensive guide for implementing and using the autonomous protocol features in Project Argus.

## Quick Start

### Enabling All Protocols

To enable all protocols (HTTP, gRPC, MQTT, Kafka), copy the example configuration:

```bash
cd backend
cp .env.protocols.example .env
```

Then start the server:

```bash
npm run dev
```

### Checking Protocol Status

Check which protocols are currently enabled:

```bash
curl http://localhost:3001/api/health/protocols
```

## Protocol Implementations

### ✅ HTTP/HTTPS Protocol
- **Status**: Fully implemented and enabled by default
- **Port**: 3001 (configurable via `HTTP_PORT`)
- **Use Cases**: Web applications, REST APIs, general-purpose integrations
- **Features**: Rate limiting, CORS support, compression, JWT authentication

### ✅ gRPC Protocol  
- **Status**: Fully implemented (enable with `GRPC_ENABLED=true`)
- **Port**: 50051 (configurable via `GRPC_PORT`)
- **Use Cases**: High-performance applications, microservices, low-latency requirements
- **Features**: Binary serialization, streaming support, TLS configuration, Protocol Buffers

### ✅ MQTT Protocol
- **Status**: Fully implemented (enable with `MQTT_ENABLED=true`)
- **Port**: 1883 standard, 8883 TLS (configurable via `MQTT_BROKER_URL`)
- **Use Cases**: IoT devices, sensor networks, edge computing
- **Features**: QoS levels, topic management, retained messages, device authentication

### ✅ Apache Kafka Protocol
- **Status**: Fully implemented (enable with `KAFKA_ENABLED=true`)
- **Port**: 9092 (configurable via `KAFKA_BROKERS`)
- **Use Cases**: Stream processing, event sourcing, high-throughput data pipelines
- **Features**: Producer/consumer implementation, topic management, batch processing

## Configuration Examples

### Development Configuration
```bash
# Enable only HTTP and gRPC for development
HTTP_ENABLED=true
HTTP_PORT=3001
GRPC_ENABLED=true
GRPC_PORT=50051
```

### Production Configuration
```bash
# Enable all protocols with security
HTTP_ENABLED=true
HTTP_PORT=3001

GRPC_ENABLED=true
GRPC_PORT=50051
GRPC_TLS_ENABLED=true

MQTT_ENABLED=true
MQTT_BROKER_URL=mqtts://mqtt.example.com:8883

KAFKA_ENABLED=true
KAFKA_BROKERS=kafka1:9092,kafka2:9092,kafka3:9092
```

### IoT-Focused Configuration
```bash
# Optimize for IoT workloads
HTTP_ENABLED=true
MQTT_ENABLED=true
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_DEFAULT_QOS=1
```

### High-Throughput Configuration
```bash
# Optimize for high throughput
HTTP_ENABLED=true
GRPC_ENABLED=true
KAFKA_ENABLED=true
KAFKA_BATCH_SIZE=32768
KAFKA_COMPRESSION_TYPE=snappy
```

## Testing Protocol Implementations

### Unit Tests
```bash
cd backend
npm test src/__tests__/protocols/
```

### Integration Testing

#### Test HTTP Protocol
```bash
curl -X POST http://localhost:3001/api/metrics \
  -H "Content-Type: application/json" \
  -d '{"name": "test.metric", "value": 42, "service": "test"}'
```

#### Test gRPC Protocol (requires grpcurl)
```bash
grpcurl -plaintext -d '{"name": "test.metric", "value": 42, "service": "test"}' \
  localhost:50051 argus.v1.MetricsService/SubmitMetric
```

#### Test MQTT Protocol (requires mosquitto-clients)
```bash
mosquitto_pub -h localhost -t argus/metrics/test/cpu.usage \
  -m '{"name": "cpu.usage", "value": 75.5, "service": "test"}'
```

#### Test Kafka Protocol (requires kafka-console-producer)
```bash
echo '{"name": "test.metric", "value": 42, "service": "test"}' | \
  kafka-console-producer --broker-list localhost:9092 --topic argus-metrics
```

## Performance Benchmarks

### Expected Throughput Targets
- **HTTP**: 10,000 requests/second
- **gRPC**: 50,000 requests/second  
- **MQTT**: 100,000 messages/second
- **Kafka**: 1,000,000 messages/second

### Expected Latency Targets
- **HTTP**: <100ms P95
- **gRPC**: <50ms P95
- **MQTT**: <10ms P95
- **Kafka**: <5ms P95 (producer)

## Troubleshooting

### Common Issues

#### gRPC Not Starting
```
Error: Failed to start gRPC server: bind EADDRINUSE :::50051
```
**Solution**: Change the gRPC port or stop the service using port 50051.

#### MQTT Connection Failed
```
Error: Failed to connect to MQTT broker: ECONNREFUSED
```
**Solution**: Ensure MQTT broker (like Mosquitto) is running:
```bash
# Install and start Mosquitto
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

#### Kafka Connection Failed
```
Error: Failed to connect to Kafka: ECONNREFUSED
```
**Solution**: Ensure Kafka is running:
```bash
# Start Kafka (requires Zookeeper)
bin/zookeeper-server-start.sh config/zookeeper.properties
bin/kafka-server-start.sh config/server.properties
```

### Debug Mode
Enable debug logging for protocols:
```bash
DEBUG=argus:protocols npm run dev
```

### Health Monitoring
Monitor protocol health in real-time:
```bash
watch -n 5 'curl -s http://localhost:3001/api/health/protocols | jq .enabled_protocols'
```

## Client SDK Examples

### JavaScript/Node.js HTTP Client
```javascript
const axios = require('axios');

const metric = {
  name: 'response_time',
  value: 145.2,
  service: 'api-server',
  tags: { endpoint: '/users' }
};

axios.post('http://localhost:3001/api/metrics', metric)
  .then(response => console.log('Metric sent:', response.data))
  .catch(error => console.error('Error:', error));
```

### Python gRPC Client
```python
import grpc
from argus_pb2 import MetricRequest
from argus_pb2_grpc import MetricsServiceStub

channel = grpc.insecure_channel('localhost:50051')
stub = MetricsServiceStub(channel)

request = MetricRequest(
    name='cpu.usage',
    value=78.5,
    service='web-server'
)

response = stub.SubmitMetric(request)
print(f'Metric sent: {response.success}')
```

### Python MQTT Client
```python
import paho.mqtt.client as mqtt
import json

def on_connect(client, userdata, flags, rc):
    print(f"Connected with result code {rc}")

client = mqtt.Client()
client.on_connect = on_connect
client.connect("localhost", 1883, 60)

metric = {
    "name": "memory.usage",
    "value": 2048.0,
    "service": "database"
}

client.publish("argus/metrics/database/memory.usage", json.dumps(metric))
```

## Migration Guide

### From Single Protocol to Multi-Protocol

If you're currently using only HTTP:

1. **Assess Requirements**: Determine which protocols match your use cases
2. **Update Configuration**: Add environment variables for desired protocols
3. **Update Clients**: Modify client applications to use appropriate protocols
4. **Monitor Performance**: Use the protocol status endpoints to monitor health

### Protocol Selection Guidelines

- **Use HTTP** for: Web applications, REST APIs, simple integrations
- **Use gRPC** for: Microservices, high-performance requirements, strong typing needs
- **Use MQTT** for: IoT devices, sensor networks, low-bandwidth environments
- **Use Kafka** for: Stream processing, event sourcing, high-throughput pipelines

## Security Considerations

### TLS/SSL Configuration
- Enable TLS for all protocols in production
- Use proper certificate management
- Implement proper key rotation

### Authentication
- HTTP: JWT tokens, API keys
- gRPC: TLS client certificates, JWT metadata
- MQTT: Username/password, client certificates  
- Kafka: SASL/SCRAM, mTLS

### Network Security
- Use firewall rules to restrict protocol access
- Implement VPN for internal protocol communication
- Monitor for unusual protocol usage patterns

---

For more detailed information, see:
- [Protocol Specification](./project_argus_protocol.md)
- [Autonomous Debugging Guide](./autonomous_debugging.md)
- [API Documentation](./docs/API_REFERENCE.md)