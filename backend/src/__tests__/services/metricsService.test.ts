import { metricsService } from '../../services/metricsService';

describe('MetricsService', () => {
  beforeEach(() => {
    // Clear any existing metrics for clean tests
    metricsService.clearAllMetrics();
  });

  describe('submitMetric', () => {
    it('should submit a metric successfully', async () => {
      const metric = {
        name: 'cpu.usage',
        value: 75.5,
        service: 'web-server',
        tags: { host: 'server-1' }
      };

      const result = await metricsService.submitMetric(metric);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(metric.name);
      expect(result.value).toBe(metric.value);
      expect(result.service).toBe(metric.service);
      expect(result.tags).toEqual(metric.tags);
    });

    it('should generate timestamp if not provided', async () => {
      const metric = {
        name: 'memory.usage',
        value: 60.0,
        service: 'api-server'
      };

      const result = await metricsService.submitMetric(metric);
      
      expect(result).toHaveProperty('timestamp');
      expect(new Date(result.timestamp).getTime()).toBeCloseTo(Date.now(), -1000);
    });

    it('should validate required fields', async () => {
      const invalidMetric = {
        value: 75.5,
        service: 'web-server'
        // missing name
      };

      await expect(metricsService.submitMetric(invalidMetric as any))
        .rejects.toThrow('Metric name is required');
    });
  });

  describe('getMetrics', () => {
    beforeEach(async () => {
      // Add test data
      await metricsService.submitMetric({
        name: 'cpu.usage',
        value: 75.5,
        service: 'web-server',
        timestamp: '2024-01-01T10:00:00Z',
        tags: {}
      });
      
      await metricsService.submitMetric({
        name: 'memory.usage',
        value: 60.0,
        service: 'api-server',
        timestamp: '2024-01-01T11:00:00Z',
        tags: {}
      });
    });

    it('should retrieve all metrics without filters', async () => {
      const result = await metricsService.getMetrics({});
      
      expect(result.metrics).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it('should filter by service', async () => {
      const result = await metricsService.getMetrics({
        service: 'web-server'
      });
      
      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0].service).toBe('web-server');
    });

    it('should filter by metric name', async () => {
      const result = await metricsService.getMetrics({
        metric_name: 'cpu.usage'
      });
      
      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0].name).toBe('cpu.usage');
    });

    it('should filter by time range', async () => {
      const result = await metricsService.getMetrics({
        start: '2024-01-01T09:00:00Z',
        end: '2024-01-01T10:30:00Z'
      });
      
      expect(result.metrics).toHaveLength(1);
      expect(result.metrics[0].name).toBe('cpu.usage');
    });
  });

  describe('getMetricsStats', () => {
    beforeEach(async () => {
      // Add test data with different services and metrics
      await metricsService.submitMetric({
        name: 'cpu.usage',
        value: 75.5,
        service: 'web-server'
      });
      
      await metricsService.submitMetric({
        name: 'memory.usage',
        value: 60.0,
        service: 'web-server'
      });
      
      await metricsService.submitMetric({
        name: 'cpu.usage',
        value: 80.0,
        service: 'api-server'
      });
    });

    it('should return correct statistics', async () => {
      const stats = await metricsService.getMetricsStats();
      
      expect(stats.total_metrics).toBe(3);
      expect(stats.unique_services).toBe(2);
      expect(stats.unique_metric_names).toBe(2);
      expect(stats).toHaveProperty('oldest_metric');
      expect(stats).toHaveProperty('newest_metric');
    });
  });
});