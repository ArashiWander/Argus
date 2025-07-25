import { logger } from '../config/logger';
import { grpcServer } from './grpcServer';
import { mqttService } from './mqttService';
import { kafkaService } from './kafkaService';

interface ProtocolConfig {
  http: {
    enabled: boolean;
    port: number;
  };
  grpc: {
    enabled: boolean;
    port: number;
    tls: boolean;
  };
  mqtt: {
    enabled: boolean;
    brokerUrl: string;
  };
  kafka: {
    enabled: boolean;
    brokers: string[];
    clientId: string;
  };
}

export class ProtocolManager {
  private config: ProtocolConfig;
  private enabledProtocols: Set<string> = new Set();

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): ProtocolConfig {
    return {
      http: {
        enabled: process.env.HTTP_ENABLED !== 'false', // Default enabled
        port: parseInt(process.env.HTTP_PORT || '3001'),
      },
      grpc: {
        enabled: process.env.GRPC_ENABLED === 'true',
        port: parseInt(process.env.GRPC_PORT || '50051'),
        tls: process.env.GRPC_TLS_ENABLED === 'true',
      },
      mqtt: {
        enabled: process.env.MQTT_ENABLED === 'true',
        brokerUrl: process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
      },
      kafka: {
        enabled: process.env.KAFKA_ENABLED === 'true',
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
        clientId: process.env.KAFKA_CLIENT_ID || 'argus-server',
      },
    };
  }

  public async startProtocols(): Promise<void> {
    logger.info('Starting protocol services...');

    // HTTP is started by the main server, so we just mark it as enabled
    if (this.config.http.enabled) {
      this.enabledProtocols.add('http');
      logger.info(`HTTP protocol enabled on port ${this.config.http.port}`);
    }

    // Start gRPC server
    if (this.config.grpc.enabled) {
      try {
        await grpcServer.start();
        this.enabledProtocols.add('grpc');
        logger.info(`gRPC protocol enabled on port ${this.config.grpc.port}`);
      } catch (error) {
        logger.error('Failed to start gRPC server:', error);
        logger.warn('gRPC protocol will be disabled');
      }
    }

    // Start MQTT service
    if (this.config.mqtt.enabled) {
      try {
        await mqttService.connect();
        this.enabledProtocols.add('mqtt');
        logger.info(`MQTT protocol enabled with broker: ${this.config.mqtt.brokerUrl}`);
      } catch (error) {
        logger.error('Failed to connect to MQTT broker:', error);
        logger.warn('MQTT protocol will be disabled');
      }
    }

    // Start Kafka service
    if (this.config.kafka.enabled) {
      try {
        // Create required topics first
        await kafkaService.createTopics([
          { topic: 'argus-metrics', numPartitions: 3 },
          { topic: 'argus-logs', numPartitions: 3 },
          { topic: 'argus-traces', numPartitions: 3 },
          { topic: 'argus-alerts', numPartitions: 3 },
        ]);

        await kafkaService.connect();
        this.enabledProtocols.add('kafka');
        logger.info(`Kafka protocol enabled with brokers: ${this.config.kafka.brokers.join(', ')}`);
      } catch (error) {
        logger.error('Failed to connect to Kafka:', error);
        logger.warn('Kafka protocol will be disabled');
      }
    }

    this.logProtocolStatus();
  }

  public async stopProtocols(): Promise<void> {
    logger.info('Stopping protocol services...');

    const stopPromises: Promise<void>[] = [];

    if (this.enabledProtocols.has('grpc')) {
      stopPromises.push(grpcServer.stop());
    }

    if (this.enabledProtocols.has('mqtt')) {
      stopPromises.push(mqttService.disconnect());
    }

    if (this.enabledProtocols.has('kafka')) {
      stopPromises.push(kafkaService.disconnect());
    }

    await Promise.allSettled(stopPromises);
    this.enabledProtocols.clear();
    logger.info('All protocol services stopped');
  }

  public getEnabledProtocols(): string[] {
    return Array.from(this.enabledProtocols);
  }

  public isProtocolEnabled(protocol: string): boolean {
    return this.enabledProtocols.has(protocol);
  }

  public getProtocolStatus(): { [key: string]: any } {
    return {
      http: {
        enabled: this.enabledProtocols.has('http'),
        port: this.config.http.port,
      },
      grpc: {
        enabled: this.enabledProtocols.has('grpc'),
        port: this.config.grpc.port,
        tls: this.config.grpc.tls,
      },
      mqtt: {
        enabled: this.enabledProtocols.has('mqtt'),
        connected: mqttService.isConnected(),
        brokerUrl: this.config.mqtt.brokerUrl,
      },
      kafka: {
        enabled: this.enabledProtocols.has('kafka'),
        connected: kafkaService.isConnectedToKafka(),
        brokers: this.config.kafka.brokers,
      },
    };
  }

  public getPerformanceMetrics(): { [key: string]: any } {
    const metrics: { [key: string]: any } = {};

    if (this.enabledProtocols.has('kafka')) {
      metrics.kafka = kafkaService.getProducerStats();
    }

    // Add more protocol-specific metrics as needed
    return metrics;
  }

  private logProtocolStatus(): void {
    const enabledCount = this.enabledProtocols.size;
    const totalCount = Object.keys(this.config).length;
    
    logger.info(`Protocol initialization complete: ${enabledCount}/${totalCount} protocols enabled`);
    
    for (const protocol of this.enabledProtocols) {
      logger.info(`  ✓ ${protocol.toUpperCase()} protocol active`);
    }

    const disabledProtocols = Object.keys(this.config).filter(p => !this.enabledProtocols.has(p));
    for (const protocol of disabledProtocols) {
      logger.info(`  ✗ ${protocol.toUpperCase()} protocol disabled`);
    }
  }

  public async healthCheck(): Promise<{ [key: string]: any }> {
    const health: { [key: string]: any } = {
      timestamp: new Date().toISOString(),
      protocols: {},
    };

    // HTTP health (always available if server is running)
    if (this.enabledProtocols.has('http')) {
      health.protocols.http = {
        status: 'healthy',
        port: this.config.http.port,
      };
    }

    // gRPC health
    if (this.enabledProtocols.has('grpc')) {
      health.protocols.grpc = {
        status: 'healthy',
        port: this.config.grpc.port,
      };
    }

    // MQTT health
    if (this.enabledProtocols.has('mqtt')) {
      health.protocols.mqtt = {
        status: mqttService.isConnected() ? 'healthy' : 'unhealthy',
        brokerUrl: this.config.mqtt.brokerUrl,
      };
    }

    // Kafka health
    if (this.enabledProtocols.has('kafka')) {
      try {
        const metadata = await kafkaService.getTopicMetadata();
        health.protocols.kafka = {
          status: kafkaService.isConnectedToKafka() ? 'healthy' : 'unhealthy',
          brokers: this.config.kafka.brokers,
          topics: metadata?.topics?.length || 0,
        };
      } catch (error) {
        health.protocols.kafka = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return health;
  }

  public getConfig(): ProtocolConfig {
    return { ...this.config };
  }

  public async publishMetricToKafka(metric: any): Promise<void> {
    if (this.enabledProtocols.has('kafka')) {
      await kafkaService.publishMetric(metric);
    }
  }

  public async publishLogToKafka(log: any): Promise<void> {
    if (this.enabledProtocols.has('kafka')) {
      await kafkaService.publishLog(log);
    }
  }

  public publishToMqtt(topic: string, payload: any): void {
    if (this.enabledProtocols.has('mqtt')) {
      mqttService.publish(topic, payload);
    }
  }
}

export const protocolManager = new ProtocolManager();