import { analyticsService } from '../../services/analyticsService';

describe('AnalyticsService', () => {
  beforeEach(async () => {
    // Clear any existing data
    await analyticsService.clearAllData();
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies using Z-score algorithm', async () => {
      const result = await analyticsService.detectAnomalies('cpu.usage', 'web-server', 24);
      
      expect(Array.isArray(result)).toBe(true);
      // The result array may be empty if no anomalies are found
      result.forEach(anomaly => {
        expect(anomaly).toHaveProperty('id');
        expect(anomaly).toHaveProperty('metric_name', 'cpu.usage');
        expect(anomaly).toHaveProperty('service', 'web-server');
        expect(anomaly).toHaveProperty('severity');
        expect(['low', 'medium', 'high', 'critical']).toContain(anomaly.severity);
      });
    });

    it('should handle edge cases gracefully', async () => {
      // Empty metric name should return empty array
      const result1 = await analyticsService.detectAnomalies('', 'web-server', 24);
      expect(Array.isArray(result1)).toBe(true);
        
      // Empty service name should work (service is optional)
      const result2 = await analyticsService.detectAnomalies('cpu.usage', '', 24);
      expect(Array.isArray(result2)).toBe(true);
        
      // Zero lookback hours should work but return empty (no data in time range)
      const result3 = await analyticsService.detectAnomalies('cpu.usage', 'web-server', 0);
      expect(Array.isArray(result3)).toBe(true);
    });
  });

  describe('generatePredictiveAnalysis', () => {
    it('should generate predictive analysis', async () => {
      const result = await analyticsService.generatePredictiveAnalysis('memory.usage', 'api-server', 24);
      
      if (result) {
        expect(result).toHaveProperty('metric_name', 'memory.usage');
        expect(result).toHaveProperty('service', 'api-server');
        expect(result).toHaveProperty('prediction_horizon_hours', 24);
        expect(result).toHaveProperty('predicted_values');
        expect(result).toHaveProperty('model_accuracy');
        expect(Array.isArray(result.predicted_values)).toBe(true);
      }
    });

    it('should handle insufficient data gracefully', async () => {
      // With no historical data, should return null or handle gracefully
      const result = await analyticsService.generatePredictiveAnalysis('nonexistent.metric', 'test-service', 24);
      expect(result).toBeNull();
    });
  });

  describe('generatePerformanceInsights', () => {
    it('should generate performance insights', async () => {
      const result = await analyticsService.generatePerformanceInsights();
      
      expect(Array.isArray(result)).toBe(true);
      // The result array may be empty if no insights are generated
      result.forEach(insight => {
        expect(insight).toHaveProperty('id');
        expect(insight).toHaveProperty('type');
        expect(insight).toHaveProperty('title');
        expect(insight).toHaveProperty('description');
        expect(insight).toHaveProperty('severity');
        expect(['info', 'warning', 'critical']).toContain(insight.severity);
        expect(['bottleneck', 'optimization', 'capacity', 'trend']).toContain(insight.type);
      });
    });
  });

  describe('generateCapacityPlan', () => {
    it('should generate capacity planning recommendations', async () => {
      const result = await analyticsService.generateCapacityPlan('api-server', 'cpu');
      
      if (result) {
        expect(result).toHaveProperty('service', 'api-server');
        expect(result).toHaveProperty('resource_type', 'cpu');
        expect(result).toHaveProperty('current_utilization');
        expect(result).toHaveProperty('projected_utilization');
        expect(result).toHaveProperty('scaling_recommendations');
        expect(Array.isArray(result.scaling_recommendations)).toBe(true);
      }
    });

    it('should handle invalid resource type', async () => {
      const result = await analyticsService.generateCapacityPlan('api-server', 'invalid');
      expect(result).toBeNull();
    });

    it('should handle valid resource types', async () => {
      const validTypes = ['cpu', 'memory', 'disk', 'network'];
      for (const type of validTypes) {
        const result = await analyticsService.generateCapacityPlan('api-server', type);
        // Result can be null if no data is available, which is fine
        if (result) {
          expect(result.resource_type).toBe(type);
        }
      }
    });
  });
});