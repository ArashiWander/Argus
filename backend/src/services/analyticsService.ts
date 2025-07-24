import { postgres } from '../config/database';
import { logger } from '../config/logger';
import { metricsService } from './metricsService';

export interface AnomalyDetectionResult {
  id: string;
  metric_name: string;
  service?: string;
  timestamp: string;
  expected_value: number;
  actual_value: number;
  anomaly_score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  created_at: string;
}

export interface PredictiveAnalysis {
  metric_name: string;
  service?: string;
  prediction_horizon_hours: number;
  predicted_values: Array<{
    timestamp: string;
    predicted_value: number;
    confidence_interval: {
      lower: number;
      upper: number;
    };
  }>;
  analysis_timestamp: string;
  model_accuracy: number;
}

export interface PerformanceInsight {
  id: string;
  type: 'bottleneck' | 'optimization' | 'capacity' | 'trend';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  affected_services: string[];
  recommended_actions: string[];
  confidence_score: number;
  created_at: string;
}

export interface CapacityPlanningResult {
  service: string;
  resource_type: string; // cpu, memory, disk, network
  current_utilization: number;
  projected_utilization: Array<{
    date: string;
    utilization: number;
    confidence: number;
  }>;
  capacity_exhaustion_date?: string;
  recommended_scaling_date: string;
  scaling_recommendations: Array<{
    action: string;
    impact: string;
    cost_estimate?: number;
  }>;
}

class AnalyticsService {
  // Fallback storage when PostgreSQL is not available
  private fallbackAnomalies: AnomalyDetectionResult[] = [];
  private fallbackInsights: PerformanceInsight[] = [];
  private nextAnomalyId = 1;
  private nextInsightId = 1;

  // Statistical anomaly detection using Z-score and moving averages
  async detectAnomalies(metricName: string, service?: string, lookbackHours: number = 24): Promise<AnomalyDetectionResult[]> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - lookbackHours * 60 * 60 * 1000);

      const metrics = await metricsService.getMetrics(
        metricName,
        service,
        startTime.toISOString(),
        endTime.toISOString()
      );

      if (metrics.length < 10) {
        return []; // Need at least 10 data points for meaningful analysis
      }

      const anomalies: AnomalyDetectionResult[] = [];
      const values = metrics.map(m => m.value);
      
      // Calculate statistical measures
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      // Detect anomalies using Z-score (threshold: 2 standard deviations)
      const zScoreThreshold = 2;
      
      for (let i = 0; i < metrics.length; i++) {
        const metric = metrics[i];
        const zScore = Math.abs((metric.value - mean) / stdDev);
        
        if (zScore > zScoreThreshold) {
          const anomaly: AnomalyDetectionResult = {
            id: `anomaly_${this.nextAnomalyId++}`,
            metric_name: metricName,
            service: service,
            timestamp: metric.timestamp,
            expected_value: mean,
            actual_value: metric.value,
            anomaly_score: zScore,
            severity: this.calculateAnomalySeverity(zScore),
            status: 'active',
            created_at: new Date().toISOString(),
          };

          anomalies.push(anomaly);
        }
      }

      // Store anomalies
      if (postgres) {
        for (const anomaly of anomalies) {
          try {
            await postgres.query(
              `INSERT INTO anomalies 
               (id, metric_name, service, timestamp, expected_value, actual_value, 
                anomaly_score, severity, status, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [anomaly.id, anomaly.metric_name, anomaly.service, anomaly.timestamp,
               anomaly.expected_value, anomaly.actual_value, anomaly.anomaly_score,
               anomaly.severity, anomaly.status, anomaly.created_at]
            );
          } catch (error) {
            logger.warn('Failed to store anomaly in database, using fallback:', error);
            this.fallbackAnomalies.push(anomaly);
          }
        }
      } else {
        this.fallbackAnomalies.push(...anomalies);
      }

      logger.info(`Detected ${anomalies.length} anomalies for metric ${metricName}`);
      return anomalies;
    } catch (error) {
      logger.error('Failed to detect anomalies:', error);
      return [];
    }
  }

  // Simple time series prediction using linear regression
  async generatePredictiveAnalysis(metricName: string, service?: string, horizonHours: number = 24): Promise<PredictiveAnalysis | null> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days of historical data

      const metrics = await metricsService.getMetrics(
        metricName,
        service,
        startTime.toISOString(),
        endTime.toISOString()
      );

      if (metrics.length < 20) {
        return null; // Need sufficient data for prediction
      }

      // Prepare data for linear regression
      const dataPoints = metrics.map((metric, index) => ({
        x: index,
        y: metric.value,
        timestamp: metric.timestamp
      }));

      // Simple linear regression calculation
      const n = dataPoints.length;
      const sumX = dataPoints.reduce((sum, point) => sum + point.x, 0);
      const sumY = dataPoints.reduce((sum, point) => sum + point.y, 0);
      const sumXY = dataPoints.reduce((sum, point) => sum + point.x * point.y, 0);
      const sumX2 = dataPoints.reduce((sum, point) => sum + point.x * point.x, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;

      // Calculate model accuracy (R-squared)
      const meanY = sumY / n;
      const totalSumSquares = dataPoints.reduce((sum, point) => sum + Math.pow(point.y - meanY, 2), 0);
      const residualSumSquares = dataPoints.reduce((sum, point) => {
        const predicted = slope * point.x + intercept;
        return sum + Math.pow(point.y - predicted, 2);
      }, 0);
      const rSquared = 1 - (residualSumSquares / totalSumSquares);

      // Generate predictions
      const predictions = [];
      const intervalMinutes = 60; // Predict every hour
      const predictionsCount = horizonHours;

      for (let i = 1; i <= predictionsCount; i++) {
        const futureX = n + i;
        const predictedValue = slope * futureX + intercept;
        const futureTimestamp = new Date(endTime.getTime() + i * intervalMinutes * 60 * 1000);

        // Simple confidence interval (±10% of predicted value)
        const confidenceMargin = Math.abs(predictedValue * 0.1);

        predictions.push({
          timestamp: futureTimestamp.toISOString(),
          predicted_value: predictedValue,
          confidence_interval: {
            lower: predictedValue - confidenceMargin,
            upper: predictedValue + confidenceMargin,
          },
        });
      }

      const analysis: PredictiveAnalysis = {
        metric_name: metricName,
        service: service,
        prediction_horizon_hours: horizonHours,
        predicted_values: predictions,
        analysis_timestamp: new Date().toISOString(),
        model_accuracy: rSquared,
      };

      logger.info(`Generated predictive analysis for ${metricName} with accuracy ${rSquared.toFixed(3)}`);
      return analysis;
    } catch (error) {
      logger.error('Failed to generate predictive analysis:', error);
      return null;
    }
  }

  // Generate performance insights based on metrics analysis
  async generatePerformanceInsights(): Promise<PerformanceInsight[]> {
    try {
      const insights: PerformanceInsight[] = [];
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours

      // Get all unique services from recent metrics
      const services = await this.getUniqueServices();

      for (const service of services) {
        // Check CPU utilization trends
        const cpuMetrics = await metricsService.getMetrics(
          'cpu.usage',
          service,
          startTime.toISOString(),
          endTime.toISOString()
        );

        if (cpuMetrics.length > 0) {
          const avgCpu = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
          const maxCpu = Math.max(...cpuMetrics.map(m => m.value));

          if (avgCpu > 80) {
            insights.push({
              id: `insight_${this.nextInsightId++}`,
              type: 'bottleneck',
              title: `High CPU utilization detected for ${service}`,
              description: `Average CPU usage is ${avgCpu.toFixed(1)}% over the last 24 hours`,
              severity: avgCpu > 95 ? 'critical' : 'warning',
              affected_services: [service],
              recommended_actions: [
                'Consider scaling up CPU resources',
                'Investigate CPU-intensive processes',
                'Implement CPU-based auto-scaling'
              ],
              confidence_score: 0.85,
              created_at: new Date().toISOString(),
            });
          }

          if (maxCpu > 95) {
            insights.push({
              id: `insight_${this.nextInsightId++}`,
              type: 'capacity',
              title: `CPU capacity limit reached for ${service}`,
              description: `Peak CPU usage reached ${maxCpu.toFixed(1)}%`,
              severity: 'critical',
              affected_services: [service],
              recommended_actions: [
                'Immediate scaling required',
                'Implement emergency load balancing',
                'Review application performance'
              ],
              confidence_score: 0.95,
              created_at: new Date().toISOString(),
            });
          }
        }

        // Check memory utilization
        const memoryMetrics = await metricsService.getMetrics(
          'memory.usage',
          service,
          startTime.toISOString(),
          endTime.toISOString()
        );

        if (memoryMetrics.length > 0) {
          const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;

          if (avgMemory > 85) {
            insights.push({
              id: `insight_${this.nextInsightId++}`,
              type: 'optimization',
              title: `Memory optimization opportunity for ${service}`,
              description: `Memory usage averaging ${avgMemory.toFixed(1)}%`,
              severity: avgMemory > 95 ? 'critical' : 'warning',
              affected_services: [service],
              recommended_actions: [
                'Review memory leaks',
                'Optimize memory allocation',
                'Consider memory-based scaling'
              ],
              confidence_score: 0.80,
              created_at: new Date().toISOString(),
            });
          }
        }
      }

      // Store insights
      if (postgres) {
        for (const insight of insights) {
          try {
            await postgres.query(
              `INSERT INTO performance_insights 
               (id, type, title, description, severity, affected_services, 
                recommended_actions, confidence_score, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [insight.id, insight.type, insight.title, insight.description,
               insight.severity, JSON.stringify(insight.affected_services),
               JSON.stringify(insight.recommended_actions), insight.confidence_score,
               insight.created_at]
            );
          } catch (error) {
            logger.warn('Failed to store insight in database, using fallback:', error);
            this.fallbackInsights.push(insight);
          }
        }
      } else {
        this.fallbackInsights.push(...insights);
      }

      logger.info(`Generated ${insights.length} performance insights`);
      return insights;
    } catch (error) {
      logger.error('Failed to generate performance insights:', error);
      return [];
    }
  }

  // Capacity planning analysis
  async generateCapacityPlan(service: string, resourceType: string): Promise<CapacityPlanningResult | null> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days historical

      const metricName = `${resourceType}.usage`;
      const metrics = await metricsService.getMetrics(
        metricName,
        service,
        startTime.toISOString(),
        endTime.toISOString()
      );

      if (metrics.length < 30) {
        return null; // Need sufficient data for capacity planning
      }

      const currentUtilization = metrics.slice(-10).reduce((sum, m) => sum + m.value, 0) / 10;

      // Simple trend analysis for capacity planning
      const dailyAverages = this.calculateDailyAverages(metrics);
      const growthRate = this.calculateGrowthRate(dailyAverages);

      // Project future utilization
      const projections = [];
      for (let days = 1; days <= 90; days += 7) { // Weekly projections for 3 months
        const futureDate = new Date(endTime.getTime() + days * 24 * 60 * 60 * 1000);
        const projectedUtilization = currentUtilization + (growthRate * days);
        
        projections.push({
          date: futureDate.toISOString().split('T')[0],
          utilization: Math.max(0, Math.min(100, projectedUtilization)),
          confidence: Math.max(0.5, 1 - (days / 90) * 0.5), // Confidence decreases over time
        });
      }

      // Determine capacity exhaustion date (when utilization reaches 90%)
      let capacityExhaustionDate: string | undefined;
      const exhaustionThreshold = 90;
      
      if (growthRate > 0) {
        const daysToExhaustion = (exhaustionThreshold - currentUtilization) / growthRate;
        if (daysToExhaustion > 0 && daysToExhaustion < 365) {
          const exhaustionDate = new Date(endTime.getTime() + daysToExhaustion * 24 * 60 * 60 * 1000);
          capacityExhaustionDate = exhaustionDate.toISOString().split('T')[0];
        }
      }

      // Recommended scaling date (when to act, typically at 80% utilization)
      const scalingThreshold = 80;
      const daysToScaling = (scalingThreshold - currentUtilization) / Math.max(growthRate, 0.1);
      const scalingDate = new Date(endTime.getTime() + Math.max(7, daysToScaling) * 24 * 60 * 60 * 1000);

      const recommendations = this.generateScalingRecommendations(resourceType, currentUtilization, growthRate);

      const capacityPlan: CapacityPlanningResult = {
        service,
        resource_type: resourceType,
        current_utilization: currentUtilization,
        projected_utilization: projections,
        capacity_exhaustion_date: capacityExhaustionDate,
        recommended_scaling_date: scalingDate.toISOString().split('T')[0],
        scaling_recommendations: recommendations,
      };

      logger.info(`Generated capacity plan for ${service} ${resourceType}`);
      return capacityPlan;
    } catch (error) {
      logger.error('Failed to generate capacity plan:', error);
      return null;
    }
  }

  // Get historical anomalies
  async getAnomalies(status?: string, severity?: string): Promise<AnomalyDetectionResult[]> {
    if (postgres) {
      try {
        let query = 'SELECT * FROM anomalies';
        const conditions: string[] = [];
        const values: any[] = [];

        if (status) {
          conditions.push(`status = $${conditions.length + 1}`);
          values.push(status);
        }

        if (severity) {
          conditions.push(`severity = $${conditions.length + 1}`);
          values.push(severity);
        }

        if (conditions.length > 0) {
          query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const result = await postgres.query(query, values);
        return result.rows;
      } catch (error) {
        logger.error('Failed to fetch anomalies:', error);
        return this.fallbackAnomalies;
      }
    } else {
      let anomalies = this.fallbackAnomalies;

      if (status) {
        anomalies = anomalies.filter(a => a.status === status);
      }

      if (severity) {
        anomalies = anomalies.filter(a => a.severity === severity);
      }

      return anomalies.slice(0, 100);
    }
  }

  // Get performance insights
  async getPerformanceInsights(type?: string): Promise<PerformanceInsight[]> {
    if (postgres) {
      try {
        let query = 'SELECT * FROM performance_insights';
        const values: any[] = [];

        if (type) {
          query += ' WHERE type = $1';
          values.push(type);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const result = await postgres.query(query, values);
        return result.rows.map(row => ({
          ...row,
          affected_services: JSON.parse(row.affected_services || '[]'),
          recommended_actions: JSON.parse(row.recommended_actions || '[]'),
        }));
      } catch (error) {
        logger.error('Failed to fetch performance insights:', error);
        return this.fallbackInsights;
      }
    } else {
      let insights = this.fallbackInsights;

      if (type) {
        insights = insights.filter(i => i.type === type);
      }

      return insights.slice(0, 50);
    }
  }

  // Helper methods
  private calculateAnomalySeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (zScore > 4) return 'critical';
    if (zScore > 3) return 'high';
    if (zScore > 2.5) return 'medium';
    return 'low';
  }

  private async getUniqueServices(): Promise<string[]> {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 24 * 60 * 60 * 1000);

      const result = await metricsService.getMetrics({
        start: startTime.toISOString(),
        end: endTime.toISOString()
      });
      const metrics = result.metrics;

      const services = [...new Set(metrics.map(m => m.service).filter(Boolean))];
      return services as string[];
    } catch (error) {
      logger.error('Failed to get unique services:', error);
      return [];
    }
  }

  private calculateDailyAverages(metrics: any[]): Array<{ date: string; average: number }> {
    const dailyData = new Map<string, number[]>();

    metrics.forEach(metric => {
      const date = metric.timestamp.split('T')[0];
      if (!dailyData.has(date)) {
        dailyData.set(date, []);
      }
      dailyData.get(date)!.push(metric.value);
    });

    return Array.from(dailyData.entries()).map(([date, values]) => ({
      date,
      average: values.reduce((sum, val) => sum + val, 0) / values.length,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateGrowthRate(dailyAverages: Array<{ date: string; average: number }>): number {
    if (dailyAverages.length < 2) return 0;

    const first = dailyAverages[0].average;
    const last = dailyAverages[dailyAverages.length - 1].average;
    const days = dailyAverages.length;

    return (last - first) / days;
  }

  private generateScalingRecommendations(resourceType: string, currentUtilization: number, growthRate: number): Array<{ action: string; impact: string; cost_estimate?: number }> {
    const recommendations = [];

    if (currentUtilization > 80) {
      recommendations.push({
        action: `Immediate ${resourceType} scaling`,
        impact: 'Prevent performance degradation',
        cost_estimate: resourceType === 'cpu' ? 50 : resourceType === 'memory' ? 30 : 100,
      });
    }

    if (growthRate > 1) {
      recommendations.push({
        action: 'Implement auto-scaling policies',
        impact: 'Automatic resource management',
        cost_estimate: 0,
      });
    }

    if (currentUtilization > 90) {
      recommendations.push({
        action: 'Emergency load balancing',
        impact: 'Distribute load across instances',
        cost_estimate: 75,
      });
    }

    return recommendations;
  }
}

export const analyticsService = new AnalyticsService();