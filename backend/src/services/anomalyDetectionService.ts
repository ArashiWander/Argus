import { logger } from '../config/logger';
import { metricsService } from './metricsService';

export interface Anomaly {
  id: string;
  metric_name: string;
  service: string;
  timestamp: string;
  actual_value: number;
  expected_value: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  algorithm: string;
  description: string;
  created_at: string;
}

export interface AnomalyDetectionConfig {
  metric_name: string;
  service?: string;
  algorithm: 'zscore' | 'iqr' | 'moving_average' | 'seasonal';
  sensitivity: number; // 1-10, higher = more sensitive
  window_minutes: number;
  enabled: boolean;
  created_at: string;
}

class AnomalyDetectionService {
  private anomalies: Map<string, Anomaly> = new Map();
  private configs: Map<string, AnomalyDetectionConfig> = new Map();

  // Create anomaly detection configuration
  async createDetectionConfig(config: Omit<AnomalyDetectionConfig, 'created_at'>): Promise<AnomalyDetectionConfig> {
    try {
      const detectionConfig: AnomalyDetectionConfig = {
        ...config,
        created_at: new Date().toISOString(),
      };

      const configKey = `${config.metric_name}:${config.service || 'all'}`;
      this.configs.set(configKey, detectionConfig);

      logger.info(`Anomaly detection config created: ${configKey}`, {
        algorithm: config.algorithm,
        sensitivity: config.sensitivity,
        window_minutes: config.window_minutes,
      });

      return detectionConfig;
    } catch (error) {
      logger.error('Failed to create anomaly detection config:', error);
      throw new Error('Failed to create anomaly detection config');
    }
  }

  // Get anomaly detection configurations
  async getDetectionConfigs(): Promise<AnomalyDetectionConfig[]> {
    return Array.from(this.configs.values());
  }

  // Update anomaly detection configuration
  async updateDetectionConfig(
    metric_name: string, 
    service: string | undefined, 
    updates: Partial<AnomalyDetectionConfig>
  ): Promise<AnomalyDetectionConfig | null> {
    try {
      const configKey = `${metric_name}:${service || 'all'}`;
      const existingConfig = this.configs.get(configKey);

      if (!existingConfig) {
        return null;
      }

      const updatedConfig = { ...existingConfig, ...updates };
      this.configs.set(configKey, updatedConfig);

      logger.info(`Anomaly detection config updated: ${configKey}`, updates);
      return updatedConfig;
    } catch (error) {
      logger.error('Failed to update anomaly detection config:', error);
      throw new Error('Failed to update anomaly detection config');
    }
  }

  // Delete anomaly detection configuration
  async deleteDetectionConfig(metric_name: string, service?: string): Promise<boolean> {
    try {
      const configKey = `${metric_name}:${service || 'all'}`;
      const deleted = this.configs.delete(configKey);

      if (deleted) {
        logger.info(`Anomaly detection config deleted: ${configKey}`);
      }

      return deleted;
    } catch (error) {
      logger.error('Failed to delete anomaly detection config:', error);
      throw new Error('Failed to delete anomaly detection config');
    }
  }

  // Run anomaly detection on all configured metrics
  async detectAnomalies(): Promise<Anomaly[]> {
    try {
      const detectedAnomalies: Anomaly[] = [];

      for (const config of this.configs.values()) {
        if (!config.enabled) continue;

        const anomalies = await this.detectAnomaliesForMetric(config);
        detectedAnomalies.push(...anomalies);
      }

      // Store new anomalies
      for (const anomaly of detectedAnomalies) {
        this.anomalies.set(anomaly.id, anomaly);
      }

      if (detectedAnomalies.length > 0) {
        logger.info(`Detected ${detectedAnomalies.length} anomalies`);
      }

      return detectedAnomalies;
    } catch (error) {
      logger.error('Failed to detect anomalies:', error);
      throw new Error('Failed to detect anomalies');
    }
  }

  // Get detected anomalies with filtering
  async getAnomalies(
    service?: string,
    metric_name?: string,
    severity?: string,
    start?: string,
    end?: string,
    limit = 100
  ): Promise<Anomaly[]> {
    try {
      let anomalies = Array.from(this.anomalies.values());

      // Apply filters
      if (service) {
        anomalies = anomalies.filter(a => a.service === service);
      }

      if (metric_name) {
        anomalies = anomalies.filter(a => a.metric_name === metric_name);
      }

      if (severity) {
        anomalies = anomalies.filter(a => a.severity === severity);
      }

      if (start) {
        const startDate = new Date(start);
        anomalies = anomalies.filter(a => new Date(a.timestamp) >= startDate);
      }

      if (end) {
        const endDate = new Date(end);
        anomalies = anomalies.filter(a => new Date(a.timestamp) <= endDate);
      }

      // Sort by timestamp (newest first) and limit
      anomalies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return anomalies.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get anomalies:', error);
      throw new Error('Failed to get anomalies');
    }
  }

  // Get anomaly statistics
  async getAnomalyStats(): Promise<any> {
    try {
      const allAnomalies = Array.from(this.anomalies.values());
      const activeConfigs = Array.from(this.configs.values()).filter(c => c.enabled);
      
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAnomalies = allAnomalies.filter(a => new Date(a.timestamp) >= last24h);

      const severityCount = allAnomalies.reduce((acc, anomaly) => {
        acc[anomaly.severity] = (acc[anomaly.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const algorithmCount = allAnomalies.reduce((acc, anomaly) => {
        acc[anomaly.algorithm] = (acc[anomaly.algorithm] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total_anomalies: allAnomalies.length,
        recent_anomalies: recentAnomalies.length,
        active_configs: activeConfigs.length,
        total_configs: this.configs.size,
        severity_distribution: severityCount,
        algorithm_distribution: algorithmCount,
        services: Array.from(new Set(allAnomalies.map(a => a.service))),
        metrics: Array.from(new Set(allAnomalies.map(a => a.metric_name))),
      };
    } catch (error) {
      logger.error('Failed to get anomaly statistics:', error);
      throw new Error('Failed to get anomaly statistics');
    }
  }

  private async detectAnomaliesForMetric(config: AnomalyDetectionConfig): Promise<Anomaly[]> {
    try {
      // Get historical data for the metric
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - (config.window_minutes * 60 * 1000));

      const result = await metricsService.getMetrics(
        config.metric_name,
        config.service,
        startTime.toISOString(),
        endTime.toISOString()
      );

      // Handle the return type - could be Metric[] or { metrics: Metric[], count: number }
      const metrics = Array.isArray(result) 
        ? result 
        : (result as { metrics: any[]; count: number }).metrics;

      if (metrics.length < 10) {
        // Not enough data for anomaly detection
        return [];
      }

      const values = metrics.map((m: any) => m.value);
      const latestValue = values[values.length - 1];
      const latestTimestamp = metrics[metrics.length - 1].timestamp;

      let anomaly: Anomaly | null = null;

      switch (config.algorithm) {
        case 'zscore':
          anomaly = this.detectZScoreAnomaly(
            config, 
            values, 
            latestValue, 
            latestTimestamp
          );
          break;
        case 'iqr':
          anomaly = this.detectIQRAnomaly(
            config, 
            values, 
            latestValue, 
            latestTimestamp
          );
          break;
        case 'moving_average':
          anomaly = this.detectMovingAverageAnomaly(
            config, 
            values, 
            latestValue, 
            latestTimestamp
          );
          break;
        case 'seasonal':
          anomaly = this.detectSeasonalAnomaly(
            config, 
            values, 
            latestValue, 
            latestTimestamp
          );
          break;
      }

      return anomaly ? [anomaly] : [];
    } catch (error) {
      logger.error(`Failed to detect anomalies for metric ${config.metric_name}:`, error);
      return [];
    }
  }

  private detectZScoreAnomaly(
    config: AnomalyDetectionConfig,
    values: number[],
    latestValue: number,
    timestamp: string
  ): Anomaly | null {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return null; // No variation in data

    const zScore = Math.abs((latestValue - mean) / stdDev);
    const threshold = 3 - (config.sensitivity - 1) * 0.2; // Scale sensitivity 1-10 to threshold 2.2-3.0

    if (zScore > threshold) {
      return {
        id: this.generateAnomalyId(),
        metric_name: config.metric_name,
        service: config.service || 'unknown',
        timestamp,
        actual_value: latestValue,
        expected_value: mean,
        deviation: zScore,
        severity: this.calculateSeverity(zScore, threshold),
        algorithm: 'zscore',
        description: `Z-score anomaly detected (z=${zScore.toFixed(2)}, threshold=${threshold.toFixed(2)})`,
        created_at: new Date().toISOString(),
      };
    }

    return null;
  }

  private detectIQRAnomaly(
    config: AnomalyDetectionConfig,
    values: number[],
    latestValue: number,
    timestamp: string
  ): Anomaly | null {
    const sortedValues = [...values].sort((a, b) => a - b);
    const q1 = this.percentile(sortedValues, 0.25);
    const q3 = this.percentile(sortedValues, 0.75);
    const iqr = q3 - q1;

    const multiplier = 1.5 + (config.sensitivity - 1) * 0.1; // Scale sensitivity 1-10 to multiplier 1.5-2.4
    const lowerBound = q1 - (multiplier * iqr);
    const upperBound = q3 + (multiplier * iqr);

    if (latestValue < lowerBound || latestValue > upperBound) {
      const deviation = Math.max(
        Math.abs(latestValue - lowerBound),
        Math.abs(latestValue - upperBound)
      ) / iqr;

      return {
        id: this.generateAnomalyId(),
        metric_name: config.metric_name,
        service: config.service || 'unknown',
        timestamp,
        actual_value: latestValue,
        expected_value: (q1 + q3) / 2, // Median as expected value
        deviation,
        severity: this.calculateSeverity(deviation, 1),
        algorithm: 'iqr',
        description: `IQR outlier detected (value=${latestValue}, bounds=[${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}])`,
        created_at: new Date().toISOString(),
      };
    }

    return null;
  }

  private detectMovingAverageAnomaly(
    config: AnomalyDetectionConfig,
    values: number[],
    latestValue: number,
    timestamp: string
  ): Anomaly | null {
    const windowSize = Math.min(20, Math.floor(values.length / 2)); // Use up to 20 points for moving average
    if (values.length < windowSize) return null;

    const recentValues = values.slice(-windowSize);
    const movingAverage = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
    
    // Calculate standard deviation of recent values
    const variance = recentValues.reduce((sum, val) => sum + Math.pow(val - movingAverage, 2), 0) / recentValues.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return null;

    const threshold = 2 + (config.sensitivity - 1) * 0.1; // Scale sensitivity
    const deviation = Math.abs(latestValue - movingAverage) / stdDev;

    if (deviation > threshold) {
      return {
        id: this.generateAnomalyId(),
        metric_name: config.metric_name,
        service: config.service || 'unknown',
        timestamp,
        actual_value: latestValue,
        expected_value: movingAverage,
        deviation,
        severity: this.calculateSeverity(deviation, threshold),
        algorithm: 'moving_average',
        description: `Moving average anomaly detected (deviation=${deviation.toFixed(2)}σ from ${windowSize}-point average)`,
        created_at: new Date().toISOString(),
      };
    }

    return null;
  }

  private detectSeasonalAnomaly(
    config: AnomalyDetectionConfig,
    values: number[],
    latestValue: number,
    timestamp: string
  ): Anomaly | null {
    // Simple seasonal detection - look for patterns every hour (60 data points assuming 1-minute intervals)
    const seasonalPeriod = 60;
    if (values.length < seasonalPeriod * 2) return null;

    // Get values from the same "time of day" in previous periods
    const seasonalValues: number[] = [];
    for (let i = values.length - 1 - seasonalPeriod; i >= 0; i -= seasonalPeriod) {
      if (i >= 0) {
        seasonalValues.push(values[i]);
      }
    }

    if (seasonalValues.length < 3) return null; // Need at least 3 seasonal points

    const seasonalMean = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
    const seasonalVariance = seasonalValues.reduce((sum, val) => sum + Math.pow(val - seasonalMean, 2), 0) / seasonalValues.length;
    const seasonalStdDev = Math.sqrt(seasonalVariance);

    if (seasonalStdDev === 0) return null;

    const threshold = 2.5 - (config.sensitivity - 1) * 0.1; // Scale sensitivity
    const deviation = Math.abs(latestValue - seasonalMean) / seasonalStdDev;

    if (deviation > threshold) {
      return {
        id: this.generateAnomalyId(),
        metric_name: config.metric_name,
        service: config.service || 'unknown',
        timestamp,
        actual_value: latestValue,
        expected_value: seasonalMean,
        deviation,
        severity: this.calculateSeverity(deviation, threshold),
        algorithm: 'seasonal',
        description: `Seasonal anomaly detected (${deviation.toFixed(2)}σ from seasonal pattern)`,
        created_at: new Date().toISOString(),
      };
    }

    return null;
  }

  private percentile(sortedArray: number[], percentile: number): number {
    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];
    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
  }

  private calculateSeverity(deviation: number, threshold: number): 'low' | 'medium' | 'high' | 'critical' {
    const ratio = deviation / threshold;
    
    if (ratio >= 3) return 'critical';
    if (ratio >= 2) return 'high';
    if (ratio >= 1.5) return 'medium';
    return 'low';
  }

  private generateAnomalyId(): string {
    return 'anomaly_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();