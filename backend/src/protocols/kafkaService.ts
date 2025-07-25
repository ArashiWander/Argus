import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '../config/logger';
import { metricsService } from '../services/metricsService';
import { logsService } from '../services/logsService';
import { tracingService } from '../services/tracingService';
import { alertService } from '../services/alertService';

interface KafkaMetricPayload {
  name: string;
  value: number;
  timestamp?: number;
  service: string;
  tags?: { [key: string]: string };
}

interface KafkaLogPayload {
  level: string;
  message: string;
  timestamp?: number;
  service: string;
  tags?: { [key: string]: string };
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumer: Consumer | null = null;
  private isConnected: boolean = false;
  private topics: string[];

  constructor(brokers: string[] = ['localhost:9092'], clientId: string = 'argus-server') {
    this.kafka = new Kafka({
      clientId,
      brokers,
      logLevel: 2, // WARN level
    });

    this.topics = [
      'argus-metrics',
      'argus-logs',
      'argus-traces',
      'argus-alerts',
    ];
  }

  public async connect(): Promise<void> {
    try {
      // Initialize producer
      this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        transactionTimeout: 30000,
      });

      await this.producer.connect();
      logger.info('Kafka producer connected');

      // Initialize consumer
      this.consumer = this.kafka.consumer({
        groupId: 'argus-processors',
        allowAutoTopicCreation: true,
      });

      await this.consumer.connect();
      logger.info('Kafka consumer connected');

      // Subscribe to topics
      await this.setupSubscriptions();

      // Start consuming messages
      await this.consumer.run({
        eachMessage: this.handleMessage.bind(this),
      });

      this.isConnected = true;
      logger.info('Kafka service fully initialized');

    } catch (error) {
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  private async setupSubscriptions(): Promise<void> {
    if (!this.consumer) return;

    try {
      // Subscribe to all Argus topics
      for (const topic of this.topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
        logger.info(`Subscribed to Kafka topic: ${topic}`);
      }
    } catch (error) {
      logger.error('Failed to subscribe to Kafka topics:', error);
      throw error;
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, partition, message } = payload;

    try {
      if (!message.value) {
        logger.warn(`Empty message received from topic ${topic}`);
        return;
      }

      const messageData = JSON.parse(message.value.toString());
      
      logger.debug(`Kafka message received from topic: ${topic}`, {
        partition,
        offset: message.offset,
        key: message.key?.toString(),
      });

      switch (topic) {
      case 'argus-metrics':
        await this.handleMetricsMessage(messageData);
        break;
      case 'argus-logs':
        await this.handleLogsMessage(messageData);
        break;
      case 'argus-traces':
        await this.handleTracesMessage(messageData);
        break;
      case 'argus-alerts':
        await this.handleAlertsMessage(messageData);
        break;
      default:
        logger.warn(`Unknown topic: ${topic}`);
      }

    } catch (error) {
      logger.error(`Error processing Kafka message from topic ${topic}:`, error);
    }
  }

  private async handleMetricsMessage(data: KafkaMetricPayload): Promise<void> {
    try {
      const metricData = {
        name: data.name,
        value: data.value,
        service: data.service,
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        tags: data.tags || {},
      };

      // Validate required fields
      if (!metricData.name || typeof metricData.value !== 'number' || !metricData.service) {
        logger.error('Invalid metric data received via Kafka:', { metricData });
        return;
      }

      const metric = await metricsService.storeMetric(metricData);
      logger.debug('Metric created from Kafka message:', { metricId: metric });

    } catch (error) {
      logger.error('Error creating metric from Kafka message:', error);
    }
  }

  private async handleLogsMessage(data: KafkaLogPayload): Promise<void> {
    try {
      const logData = {
        level: data.level,
        message: data.message,
        service: data.service,
        timestamp: data.timestamp ? new Date(data.timestamp).toISOString() : new Date().toISOString(),
        tags: data.tags || {},
      };

      // Validate required fields
      if (!logData.level || !logData.message || !logData.service) {
        logger.error('Invalid log data received via Kafka:', { logData });
        return;
      }

      const log = await logsService.storeLog(logData);
      logger.debug('Log created from Kafka message:', { logId: log });

    } catch (error) {
      logger.error('Error creating log from Kafka message:', error);
    }
  }

  private async handleTracesMessage(data: any): Promise<void> {
    try {
      // Validate trace data structure
      if (!data.trace_id || !data.span_id || !data.operation_name || !data.service_name) {
        logger.error('Invalid trace data received via Kafka:', { data });
        return;
      }

      const spanData = {
        id: data.span_id,
        trace_id: data.trace_id,
        parent_id: data.parent_id,
        operation_name: data.operation_name,
        service_name: data.service_name,
        start_time: data.start_time || new Date().toISOString(),
        end_time: data.end_time,
        duration_ms: data.duration_ms,
        status: data.status || 'ok',
        tags: data.tags || {},
        logs: data.logs || [],
      };

      const span = await tracingService.submitSpan(spanData);
      logger.debug('Trace span created from Kafka message:', { spanId: span.id, traceId: span.trace_id });

    } catch (error) {
      logger.error('Error processing trace message:', error);
    }
  }

  private async handleAlertsMessage(data: any): Promise<void> {
    try {
      // Validate alert data structure
      if (!data.rule_name || !data.metric_name || !data.current_value || !data.threshold) {
        logger.error('Invalid alert data received via Kafka:', { data });
        return;
      }

      const alertData = {
        rule_id: data.rule_id || 0,
        rule_name: data.rule_name,
        metric_name: data.metric_name,
        service: data.service,
        current_value: data.current_value,
        threshold: data.threshold,
        condition: data.condition || 'greater_than',
        severity: data.severity || 'medium',
        status: data.status || 'active',
        message: data.message || `Alert for ${data.metric_name}: ${data.current_value} ${data.condition} ${data.threshold}`,
      };

      const alert = await alertService.createAlert(alertData);
      logger.debug('Alert created from Kafka message:', { alertId: alert.id, ruleName: alert.rule_name });

    } catch (error) {
      logger.error('Error processing alert message:', error);
    }
  }

  public async publishMetric(metric: KafkaMetricPayload): Promise<void> {
    await this.publish('argus-metrics', metric, metric.service);
  }

  public async publishLog(log: KafkaLogPayload): Promise<void> {
    await this.publish('argus-logs', log, log.service);
  }

  public async publishTrace(trace: any): Promise<void> {
    await this.publish('argus-traces', trace, trace.service || trace.traceId);
  }

  public async publishAlert(alert: any): Promise<void> {
    await this.publish('argus-alerts', alert, alert.service || alert.id);
  }

  private async publish(topic: string, data: any, key?: string): Promise<void> {
    if (!this.producer || !this.isConnected) {
      logger.warn('Cannot publish to Kafka: producer not connected');
      return;
    }

    try {
      const message = {
        key: key || null,
        value: JSON.stringify(data),
        timestamp: Date.now().toString(),
      };

      await this.producer.send({
        topic,
        messages: [message],
      });

      logger.debug(`Published message to Kafka topic: ${topic}`);

    } catch (error) {
      logger.error(`Failed to publish to Kafka topic ${topic}:`, error);
      throw error;
    }
  }

  public async publishBatch(topic: string, messages: Array<{ key?: string; value: any }>): Promise<void> {
    if (!this.producer || !this.isConnected) {
      logger.warn('Cannot publish batch to Kafka: producer not connected');
      return;
    }

    try {
      const kafkaMessages = messages.map((msg) => ({
        key: msg.key || null,
        value: JSON.stringify(msg.value),
        timestamp: Date.now().toString(),
      }));

      await this.producer.send({
        topic,
        messages: kafkaMessages,
      });

      logger.debug(`Published batch of ${messages.length} messages to Kafka topic: ${topic}`);

    } catch (error) {
      logger.error(`Failed to publish batch to Kafka topic ${topic}:`, error);
      throw error;
    }
  }

  public async createTopics(topics: Array<{ topic: string; numPartitions?: number; replicationFactor?: number }>): Promise<void> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const existingTopics = await admin.listTopics();
      const topicsToCreate = topics.filter(t => !existingTopics.includes(t.topic));

      if (topicsToCreate.length > 0) {
        await admin.createTopics({
          topics: topicsToCreate.map(t => ({
            topic: t.topic,
            numPartitions: t.numPartitions || 3,
            replicationFactor: t.replicationFactor || 1,
          })),
        });

        logger.info(`Created Kafka topics: ${topicsToCreate.map(t => t.topic).join(', ')}`);
      } else {
        logger.info('All required Kafka topics already exist');
      }

      await admin.disconnect();

    } catch (error) {
      logger.error('Failed to create Kafka topics:', error);
      throw error;
    }
  }

  public async getTopicMetadata(): Promise<any> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const metadata = await admin.fetchTopicMetadata({ topics: this.topics });
      
      await admin.disconnect();
      
      return metadata;

    } catch (error) {
      logger.error('Failed to fetch Kafka topic metadata:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (this.consumer) {
        await this.consumer.disconnect();
        logger.info('Kafka consumer disconnected');
      }

      if (this.producer) {
        await this.producer.disconnect();
        logger.info('Kafka producer disconnected');
      }

      this.isConnected = false;
      logger.info('Kafka service disconnected');

    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
      throw error;
    }
  }

  public isConnectedToKafka(): boolean {
    return this.isConnected;
  }

  public getProducerStats(): any {
    // Return producer statistics if available
    return {
      connected: this.isConnected,
      topics: this.topics,
    };
  }

  public async commitOffsets(): Promise<void> {
    if (this.consumer) {
      // Commit all current offsets for all topics/partitions
      await this.consumer.commitOffsets([]);
      logger.debug('Kafka consumer offsets committed');
    }
  }
}

export const kafkaService = new KafkaService(
  (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  process.env.KAFKA_CLIENT_ID || 'argus-server'
);