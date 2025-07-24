import { Point, WriteApi } from '@influxdata/influxdb-client';
import { influxDB, dbConfig } from '../config/database';
import { logger } from '../config/logger';

export interface Metric {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  tags: Record<string, string>;
  service: string;
  created_at: string;
}

export interface MetricQuery {
  start?: string;
  end?: string;
  service?: string;
  metric_name?: string;
}

export interface MetricStats {
  total_metrics: number;
  unique_services: number;
  unique_metric_names: number;
  oldest_metric: string | null;
  newest_metric: string | null;
}

class MetricsService {
  private writeApi: WriteApi | null = null;
  private fallbackStorage: Metric[] = [];

  constructor() {
    this.initializeWriteApi();
  }

  private initializeWriteApi(): void {
    if (influxDB) {
      this.writeApi = influxDB.getWriteApi(dbConfig.influx.org, dbConfig.influx.bucket);
      this.writeApi.useDefaultTags({ application: 'argus' });
    }
  }

  async storeMetric(metricData: Omit<Metric, 'id' | 'created_at'>): Promise<string> {
    const metric: Metric = {
      id: Date.now().toString(),
      ...metricData,
      created_at: new Date().toISOString(),
    };

    if (this.writeApi && influxDB) {
      try {
        // Create InfluxDB point
        const point = new Point(metric.name)
          .floatField('value', metric.value)
          .tag('service', metric.service)
          .timestamp(new Date(metric.timestamp));

        // Add custom tags
        Object.entries(metric.tags).forEach(([key, value]) => {
          point.tag(key, value);
        });

        this.writeApi.writePoint(point);
        await this.writeApi.flush();

        logger.info(`Metric stored in InfluxDB: ${metric.name} = ${metric.value} from ${metric.service}`);
        return metric.id;
      } catch (error) {
        logger.error('Failed to store metric in InfluxDB, falling back to memory:', error);
        return this.storeFallback(metric);
      }
    } else {
      return this.storeFallback(metric);
    }
  }

  private storeFallback(metric: Metric): string {
    this.fallbackStorage.push(metric);
    
    // Keep only last 1000 metrics in memory for demo
    if (this.fallbackStorage.length > 1000) {
      this.fallbackStorage.splice(0, this.fallbackStorage.length - 1000);
    }

    logger.info(`Metric stored in memory: ${metric.name} = ${metric.value} from ${metric.service}`);
    return metric.id;
  }

  // Method overloads for alertService compatibility
  async getMetrics(
    metricName: string,
    service?: string,
    startTime?: string,
    endTime?: string
  ): Promise<Metric[]>;
  async getMetrics(query?: MetricQuery): Promise<{ metrics: Metric[]; count: number }>;
  async getMetrics(
    queryOrMetricName?: MetricQuery | string,
    service?: string,
    startTime?: string,
    endTime?: string
  ): Promise<{ metrics: Metric[]; count: number } | Metric[]> {
    let query: MetricQuery;

    // Handle different call signatures
    if (typeof queryOrMetricName === 'string') {
      // Called with individual parameters (metric_name, service, startTime, endTime)
      query = {
        metric_name: queryOrMetricName,
        service,
        start: startTime,
        end: endTime,
      };
      
      const result = await this.getMetricsData(query);
      return result.metrics; // Return just the metrics array for alertService
    } else {
      // Called with query object (existing behavior)
      query = queryOrMetricName || {};
      return await this.getMetricsData(query);
    }
  }

  private async getMetricsData(query: MetricQuery): Promise<{ metrics: Metric[]; count: number }> {
    if (influxDB) {
      try {
        return await this.getFromInfluxDB(query);
      } catch (error) {
        logger.error('Failed to fetch metrics from InfluxDB, falling back to memory:', error);
        return this.getFromFallback(query);
      }
    } else {
      return this.getFromFallback(query);
    }
  }

  private async getFromInfluxDB(query: MetricQuery): Promise<{ metrics: Metric[]; count: number }> {
    const queryApi = influxDB!.getQueryApi(dbConfig.influx.org);
    
    let fluxQuery = `from(bucket: "${dbConfig.influx.bucket}")`;
    
    // Time range
    const start = query.start || '-7d';
    const end = query.end || 'now()';
    fluxQuery += ` |> range(start: ${start}, stop: ${end})`;
    
    // Filters
    if (query.service) {
      fluxQuery += ` |> filter(fn: (r) => r.service == "${query.service}")`;
    }
    
    if (query.metric_name) {
      fluxQuery += ` |> filter(fn: (r) => r._measurement == "${query.metric_name}")`;
    }

    fluxQuery += ` |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")`;
    fluxQuery += ` |> sort(columns: ["_time"], desc: true)`;
    fluxQuery += ` |> limit(n: 1000)`;

    const metrics: Metric[] = [];
    
    await queryApi.queryRows(fluxQuery, {
      next(row: any, tableMeta: any) {
        const o = tableMeta.toObject(row);
        const metric: Metric = {
          id: `${o._time}-${Math.random().toString(36).substr(2, 9)}`,
          name: o._measurement,
          value: o.value || 0,
          timestamp: o._time,
          service: o.service || 'unknown',
          tags: {},
          created_at: o._time,
        };

        // Extract custom tags
        Object.entries(o).forEach(([key, value]) => {
          if (!['_time', '_measurement', 'value', 'service', '_start', '_stop', '_field', 'application'].includes(key)) {
            metric.tags[key] = String(value);
          }
        });

        metrics.push(metric);
      },
      error(error: any) {
        logger.error('Error in InfluxDB query:', error);
        throw error;
      },
      complete() {
        // Query completed
      },
    });

    return { metrics, count: metrics.length };
  }

  private getFromFallback(query: MetricQuery): { metrics: Metric[]; count: number } {
    let filteredMetrics = this.fallbackStorage;

    // Apply filters
    if (query.service) {
      filteredMetrics = filteredMetrics.filter(m => m.service === query.service);
    }

    if (query.metric_name) {
      filteredMetrics = filteredMetrics.filter(m => m.name === query.metric_name);
    }

    if (query.start || query.end) {
      const startTime = query.start ? new Date(query.start).getTime() : 0;
      const endTime = query.end ? new Date(query.end).getTime() : Date.now();

      filteredMetrics = filteredMetrics.filter(m => {
        const metricTime = new Date(m.timestamp).getTime();
        return metricTime >= startTime && metricTime <= endTime;
      });
    }

    return { metrics: filteredMetrics, count: filteredMetrics.length };
  }

  async getStats(): Promise<MetricStats> {
    if (influxDB) {
      try {
        return await this.getStatsFromInfluxDB();
      } catch (error) {
        logger.error('Failed to get stats from InfluxDB, falling back to memory:', error);
        return this.getStatsFromFallback();
      }
    } else {
      return this.getStatsFromFallback();
    }
  }

  private async getStatsFromInfluxDB(): Promise<MetricStats> {
    const queryApi = influxDB!.getQueryApi(dbConfig.influx.org);
    
    // Query for basic stats
    const countQuery = `
      from(bucket: "${dbConfig.influx.bucket}")
        |> range(start: -30d)
        |> count()
        |> group()
        |> sum()
    `;

    let totalMetrics = 0;
    await queryApi.queryRows(countQuery, {
      next(row: any, tableMeta: any) {
        const o = tableMeta.toObject(row);
        totalMetrics = o._value || 0;
      },
      error(error: any) {
        logger.error('Error in InfluxDB count query:', error);
      },
      complete() {
        // Query completed
      },
    });

    // Get unique services and metric names (simplified for now)
    const { metrics } = await this.getMetrics({ start: '-7d' });
    const uniqueServices = new Set(metrics.map(m => m.service)).size;
    const uniqueMetricNames = new Set(metrics.map(m => m.name)).size;

    return {
      total_metrics: totalMetrics,
      unique_services: uniqueServices,
      unique_metric_names: uniqueMetricNames,
      oldest_metric: metrics.length > 0 ? metrics[metrics.length - 1]?.timestamp : null,
      newest_metric: metrics.length > 0 ? metrics[0]?.timestamp : null,
    };
  }

  private getStatsFromFallback(): MetricStats {
    const metrics = this.fallbackStorage;
    return {
      total_metrics: metrics.length,
      unique_services: new Set(metrics.map(m => m.service)).size,
      unique_metric_names: new Set(metrics.map(m => m.name)).size,
      oldest_metric: metrics.length > 0 ? metrics[0]?.timestamp : null,
      newest_metric: metrics.length > 0 ? metrics[metrics.length - 1]?.timestamp : null,
    };
  }

  async submitMetric(metricData: { 
    name: string; 
    value: number; 
    service: string; 
    timestamp?: string; 
    tags?: Record<string, string>; 
  }): Promise<Metric> {
    // Validate required fields
    if (!metricData.name) {
      throw new Error('Metric name is required');
    }
    if (metricData.value === undefined || metricData.value === null) {
      throw new Error('Metric value is required');
    }
    if (!metricData.service) {
      throw new Error('Metric service is required');
    }

    // Set default values
    const enrichedData = {
      ...metricData,
      timestamp: metricData.timestamp || new Date().toISOString(),
      tags: metricData.tags || {}
    };

    const id = await this.storeMetric(enrichedData);
    
    return {
      id,
      ...enrichedData,
      created_at: new Date().toISOString()
    };
  }

  async getMetricsStats(): Promise<MetricStats> {
    return this.getStats();
  }

  clearAllMetrics(): void {
    this.fallbackStorage = [];
    logger.info('All metrics cleared from memory storage');
  }

  async close(): Promise<void> {
    if (this.writeApi) {
      try {
        await this.writeApi.close();
      } catch (error) {
        logger.error('Error closing InfluxDB write API:', error);
      }
    }
  }
}

export const metricsService = new MetricsService();