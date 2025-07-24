import { InfluxDB } from '@influxdata/influxdb-client';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { logger } from './logger';

// Database configuration
export const dbConfig = {
  influx: {
    url: process.env.INFLUXDB_URL || 'http://localhost:8086',
    token: process.env.INFLUXDB_TOKEN || '',
    org: process.env.INFLUXDB_ORG || 'argus',
    bucket: process.env.INFLUXDB_BUCKET || 'metrics',
  },
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    auth: process.env.ELASTICSEARCH_AUTH ? {
      username: process.env.ELASTICSEARCH_USERNAME || '',
      password: process.env.ELASTICSEARCH_PASSWORD || '',
    } : undefined,
  },
  postgres: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/argus',
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    lazyConnect: true,
  },
};

// Database connections
export let influxDB: InfluxDB | null = null;
export let elasticsearch: ElasticsearchClient | null = null;
export let postgres: Pool | null = null;
export let redis: Redis | null = null;

// Initialize database connections
export const initializeDatabases = async (): Promise<void> => {
  logger.info('Initializing database connections...');

  try {
    // Initialize InfluxDB (for metrics)
    if (process.env.INFLUXDB_URL) {
      influxDB = new InfluxDB({
        url: dbConfig.influx.url,
        token: dbConfig.influx.token,
      });
      logger.info('InfluxDB connection initialized');
    } else {
      logger.warn('InfluxDB URL not provided, using in-memory storage for metrics');
    }

    // Initialize Elasticsearch (for logs)
    if (process.env.ELASTICSEARCH_URL) {
      elasticsearch = new ElasticsearchClient(dbConfig.elasticsearch);
      await elasticsearch.ping();
      logger.info('Elasticsearch connection established');
    } else {
      logger.warn('Elasticsearch URL not provided, using in-memory storage for logs');
    }

    // Initialize PostgreSQL (for metadata and configuration)
    if (process.env.DATABASE_URL) {
      postgres = new Pool(dbConfig.postgres);
      await postgres.query('SELECT NOW()');
      logger.info('PostgreSQL connection established');
    } else {
      logger.warn('PostgreSQL URL not provided, using in-memory storage for metadata');
    }

    // Initialize Redis (for caching)
    if (process.env.REDIS_URL) {
      redis = new Redis(dbConfig.redis);
      await redis.ping();
      logger.info('Redis connection established');
    } else {
      logger.warn('Redis URL not provided, caching disabled');
    }
  } catch (error) {
    logger.error('Failed to initialize some database connections:', error);
    // Don't throw error to allow fallback to in-memory storage
  }
};

// Close database connections
export const closeDatabases = async (): Promise<void> => {
  logger.info('Closing database connections...');

  try {
    if (influxDB) {
      // InfluxDB client doesn't have explicit close method
      influxDB = null;
    }

    if (elasticsearch) {
      await elasticsearch.close();
      elasticsearch = null;
    }

    if (postgres) {
      await postgres.end();
      postgres = null;
    }

    if (redis) {
      redis.disconnect();
      redis = null;
    }

    logger.info('All database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }
};

// Health check for databases
export const checkDatabaseHealth = async (): Promise<{
  influx: string;
  elasticsearch: string;
  postgres: string;
  redis: string;
}> => {
  const health = {
    influx: 'not_connected',
    elasticsearch: 'not_connected',
    postgres: 'not_connected',
    redis: 'not_connected',
  };

  try {
    // Check InfluxDB
    if (influxDB) {
      // For now, just check if the client exists
      health.influx = 'healthy';
    }
  } catch (error) {
    health.influx = 'error';
  }

  try {
    // Check Elasticsearch
    if (elasticsearch) {
      await elasticsearch.ping();
      health.elasticsearch = 'healthy';
    }
  } catch (error) {
    health.elasticsearch = 'error';
  }

  try {
    // Check PostgreSQL
    if (postgres) {
      await postgres.query('SELECT 1');
      health.postgres = 'healthy';
    }
  } catch (error) {
    health.postgres = 'error';
  }

  try {
    // Check Redis
    if (redis) {
      await redis.ping();
      health.redis = 'healthy';
    }
  } catch (error) {
    health.redis = 'error';
  }

  return health;
};