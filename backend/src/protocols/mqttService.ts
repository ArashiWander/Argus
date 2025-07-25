import mqtt from 'mqtt';
import { logger } from '../config/logger';
import { metricsService } from '../services/metricsService';
import { logsService } from '../services/logsService';

interface MqttMetricPayload {
  name: string;
  value: number;
  timestamp?: number;
  service: string;
  tags?: { [key: string]: string };
}

interface MqttLogPayload {
  level: string;
  message: string;
  timestamp?: number;
  service: string;
  tags?: { [key: string]: string };
}

export class MqttService {
  private client: mqtt.MqttClient | null = null;
  private brokerUrl: string;
  private options: mqtt.IClientOptions;

  constructor(brokerUrl: string = 'mqtt://localhost:1883') {
    this.brokerUrl = brokerUrl;
    this.options = {
      clientId: `argus-server-${Math.random().toString(16).substr(2, 8)}`,
      keepalive: 60,
      protocolId: 'MQTT',
      protocolVersion: 4,
      clean: true,
      reconnectPeriod: 1000,
      connectTimeout: 30 * 1000,
      will: {
        topic: 'argus/health/server',
        payload: JSON.stringify({
          status: 'offline',
          timestamp: new Date().toISOString(),
        }),
        qos: 1,
        retain: true,
      },
    };
  }

  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.client = mqtt.connect(this.brokerUrl, this.options);

        this.client.on('connect', () => {
          logger.info(`MQTT client connected to ${this.brokerUrl}`);
          this.setupSubscriptions();
          this.publishHealthStatus('online');
          resolve();
        });

        this.client.on('error', (error) => {
          logger.error('MQTT connection error:', error);
          reject(error);
        });

        this.client.on('close', () => {
          logger.warn('MQTT connection closed');
        });

        this.client.on('reconnect', () => {
          logger.info('MQTT client reconnecting...');
        });

        this.client.on('offline', () => {
          logger.warn('MQTT client offline');
        });

        this.client.on('message', this.handleMessage.bind(this));

      } catch (error) {
        logger.error('Failed to create MQTT client:', error);
        reject(error);
      }
    });
  }

  private setupSubscriptions(): void {
    if (!this.client) return;

    // Subscribe to metrics topics
    this.client.subscribe('argus/metrics/+/+', { qos: 1 }, (error) => {
      if (error) {
        logger.error('Failed to subscribe to metrics topic:', error);
      } else {
        logger.info('Subscribed to MQTT metrics topics: argus/metrics/+/+');
      }
    });

    // Subscribe to logs topics
    this.client.subscribe('argus/logs/+/+', { qos: 1 }, (error) => {
      if (error) {
        logger.error('Failed to subscribe to logs topic:', error);
      } else {
        logger.info('Subscribed to MQTT logs topics: argus/logs/+/+');
      }
    });

    // Subscribe to health check topics
    this.client.subscribe('argus/health/+', { qos: 1 }, (error) => {
      if (error) {
        logger.error('Failed to subscribe to health topic:', error);
      } else {
        logger.info('Subscribed to MQTT health topics: argus/health/+');
      }
    });

    // Subscribe to command topics for server control
    this.client.subscribe('argus/commands/server', { qos: 2 }, (error) => {
      if (error) {
        logger.error('Failed to subscribe to commands topic:', error);
      } else {
        logger.info('Subscribed to MQTT commands topic: argus/commands/server');
      }
    });
  }

  private async handleMessage(topic: string, message: Buffer): Promise<void> {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split('/');

      logger.debug(`MQTT message received on topic: ${topic}`, { payload });

      if (topicParts[0] !== 'argus') {
        logger.warn(`Unknown topic prefix: ${topic}`);
        return;
      }

      switch (topicParts[1]) {
        case 'metrics':
          await this.handleMetricMessage(topicParts, payload);
          break;
        case 'logs':
          await this.handleLogMessage(topicParts, payload);
          break;
        case 'health':
          await this.handleHealthMessage(topicParts, payload);
          break;
        case 'commands':
          await this.handleCommandMessage(topicParts, payload);
          break;
        default:
          logger.warn(`Unknown message type: ${topicParts[1]}`);
      }
    } catch (error) {
      logger.error(`Error processing MQTT message on topic ${topic}:`, error);
    }
  }

  private async handleMetricMessage(topicParts: string[], payload: MqttMetricPayload): Promise<void> {
    try {
      // Topic format: argus/metrics/{service}/{metric_name}
      const service = topicParts[2];
      const metricName = topicParts[3];

      const metricData = {
        name: payload.name || metricName,
        value: payload.value,
        service: payload.service || service,
        timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
        tags: payload.tags || {},
      };

      // Validate required fields
      if (!metricData.name || typeof metricData.value !== 'number' || !metricData.service) {
        logger.error('Invalid metric data received via MQTT:', { metricData });
        return;
      }

      const metric = await metricsService.storeMetric(metricData);
      logger.debug('Metric created from MQTT message:', { metricId: metric });

    } catch (error) {
      logger.error('Error creating metric from MQTT message:', error);
    }
  }

  private async handleLogMessage(topicParts: string[], payload: MqttLogPayload): Promise<void> {
    try {
      // Topic format: argus/logs/{service}/{level}
      const service = topicParts[2];
      const level = topicParts[3];

      const logData = {
        level: payload.level || level,
        message: payload.message,
        service: payload.service || service,
        timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : new Date().toISOString(),
        tags: payload.tags || {},
      };

      // Validate required fields
      if (!logData.level || !logData.message || !logData.service) {
        logger.error('Invalid log data received via MQTT:', { logData });
        return;
      }

      const log = await logsService.storeLog(logData);
      logger.debug('Log created from MQTT message:', { logId: log });

    } catch (error) {
      logger.error('Error creating log from MQTT message:', error);
    }
  }

  private async handleHealthMessage(topicParts: string[], payload: any): Promise<void> {
    try {
      // Topic format: argus/health/{service}
      const service = topicParts[2];
      
      logger.info(`Health status received for service ${service}:`, payload);
      
      // Could store health status in database or trigger alerts
      // For now, just log the health information
      
    } catch (error) {
      logger.error('Error processing health message:', error);
    }
  }

  private async handleCommandMessage(topicParts: string[], payload: any): Promise<void> {
    try {
      // Topic format: argus/commands/{target}
      const target = topicParts[2];
      
      if (target === 'server') {
        logger.info('Server command received:', payload);
        
        switch (payload.command) {
          case 'health':
            this.publishHealthStatus('online');
            break;
          case 'stats':
            await this.publishServerStats();
            break;
          default:
            logger.warn(`Unknown server command: ${payload.command}`);
        }
      }
      
    } catch (error) {
      logger.error('Error processing command message:', error);
    }
  }

  private publishHealthStatus(status: 'online' | 'offline'): void {
    if (!this.client) return;

    const healthPayload = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
    };

    this.client.publish(
      'argus/health/server',
      JSON.stringify(healthPayload),
      { qos: 1, retain: true },
      (error) => {
        if (error) {
          logger.error('Failed to publish health status:', error);
        } else {
          logger.debug(`Published health status: ${status}`);
        }
      }
    );
  }

  private async publishServerStats(): Promise<void> {
    if (!this.client) return;

    try {
      const metricsStats = await metricsService.getStats();
      const logsStats = await logsService.getStats();

      const statsPayload = {
        timestamp: new Date().toISOString(),
        metrics: metricsStats,
        logs: logsStats,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
      };

      this.client.publish(
        'argus/stats/server',
        JSON.stringify(statsPayload),
        { qos: 1 },
        (error) => {
          if (error) {
            logger.error('Failed to publish server stats:', error);
          } else {
            logger.debug('Published server stats');
          }
        }
      );
    } catch (error) {
      logger.error('Error generating server stats:', error);
    }
  }

  public async disconnect(): Promise<void> {
    if (!this.client) return;

    return new Promise((resolve) => {
      if (this.client) {
        this.publishHealthStatus('offline');
        
        this.client.end(false, {}, () => {
          logger.info('MQTT client disconnected');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  public isConnected(): boolean {
    return this.client?.connected || false;
  }

  public publish(topic: string, payload: any, options?: mqtt.IClientPublishOptions): void {
    if (!this.client || !this.client.connected) {
      logger.warn('Cannot publish MQTT message: client not connected');
      return;
    }

    const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    this.client.publish(topic, message, options || { qos: 1 }, (error) => {
      if (error) {
        logger.error(`Failed to publish to topic ${topic}:`, error);
      } else {
        logger.debug(`Published message to topic: ${topic}`);
      }
    });
  }
}

export const mqttService = new MqttService(process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883');