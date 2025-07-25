import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { resolve } from 'path';
import { logger } from '../config/logger';
import { metricsService } from '../services/metricsService';
import { logsService } from '../services/logsService';

interface GrpcMetricRequest {
  name: string;
  value: number;
  timestamp?: number;
  service: string;
  tags?: { [key: string]: string };
}

interface GrpcLogRequest {
  level: string;
  message: string;
  timestamp?: number;
  service: string;
  tags?: { [key: string]: string };
}

interface GrpcMetricQuery {
  service?: string;
  metric_name?: string;
  start_time?: number;
  end_time?: number;
  tags?: { [key: string]: string };
  limit?: number;
}

interface GrpcLogQuery {
  service?: string;
  level?: string;
  start_time?: number;
  end_time?: number;
  search?: string;
  tags?: { [key: string]: string };
  limit?: number;
  offset?: number;
}

interface GrpcHealthCheckRequest {
  service?: string;
}

// Note: gRPC protobuf generated types are complex to type properly
// Using any for proto service definitions is acceptable practice

// Load proto definition
const PROTO_PATH = resolve(__dirname, '../../proto/argus.proto');
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

// Load proto definition - using any for proto generated types which are complex to type
const argusProto = grpc.loadPackageDefinition(packageDefinition) as any;

export class GrpcServer {
  private server: grpc.Server;
  private port: number;

  constructor(port: number = 50051) {
    this.server = new grpc.Server();
    this.port = port;
    this.setupServices();
  }

  private setupServices(): void {
    // Metrics Service
    this.server.addService(argusProto.argus.v1.MetricsService.service, {
      SubmitMetric: this.submitMetric.bind(this),
      SubmitMetricsStream: this.submitMetricsStream.bind(this),
      QueryMetrics: this.queryMetrics.bind(this),
    });

    // Logs Service
    this.server.addService(argusProto.argus.v1.LogsService.service, {
      SubmitLog: this.submitLog.bind(this),
      SubmitLogsStream: this.submitLogsStream.bind(this),
      QueryLogs: this.queryLogs.bind(this),
    });

    // Health Service
    this.server.addService(argusProto.argus.v1.HealthService.service, {
      Check: this.healthCheck.bind(this),
      Watch: this.healthWatch.bind(this),
    });
  }

  // Metrics Service Implementations
  private async submitMetric(
    call: grpc.ServerUnaryCall<GrpcMetricRequest, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const request = call.request;
      
      // Convert gRPC request to internal format
      const metricData = {
        name: request.name,
        value: request.value,
        service: request.service,
        timestamp: request.timestamp ? new Date(request.timestamp).toISOString() : new Date().toISOString(),
        tags: request.tags || {},
      };

      const metric = await metricsService.storeMetric(metricData);

      callback(null, {
        success: true,
        message: 'Metric submitted successfully',
        metric_id: metric,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('gRPC SubmitMetric error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  private submitMetricsStream(
    call: grpc.ServerReadableStream<GrpcMetricRequest, any>,
    callback: grpc.sendUnaryData<any>
  ): void {
    const metrics: any[] = [];
    let processedCount = 0;

    call.on('data', async (request: GrpcMetricRequest) => {
      try {
        const metricData = {
          name: request.name,
          value: request.value,
          service: request.service,
          timestamp: request.timestamp ? new Date(request.timestamp).toISOString() : new Date().toISOString(),
          tags: request.tags || {},
        };

        const metric = await metricsService.storeMetric(metricData);
        metrics.push(metric);
        processedCount++;
      } catch (error) {
        logger.error('Error processing metric in stream:', error);
      }
    });

    call.on('end', () => {
      // Send response using callback
      callback(null, {
        success: true,
        message: `Processed ${processedCount} metrics successfully`,
        metric_id: '',
        timestamp: Date.now(),
      });
    });

    call.on('error', (error) => {
      logger.error('gRPC SubmitMetricsStream error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Stream processing error',
      });
    });
  }

  private async queryMetrics(
    call: grpc.ServerWritableStream<GrpcMetricQuery, any>
  ): Promise<void> {
    try {
      const query = call.request;
      
      // Convert gRPC query to internal format
      const queryParams: any = {};
      if (query.service) queryParams.service = query.service;
      if (query.metric_name) queryParams.metric_name = query.metric_name;
      if (query.start_time) queryParams.start = new Date(query.start_time).toISOString();
      if (query.end_time) queryParams.end = new Date(query.end_time).toISOString();

      const result = await metricsService.getMetrics(queryParams);

      // Stream results back to client
      for (const metric of result) {
        call.write({
          success: true,
          message: 'Metric data',
          metric_id: metric.id,
          timestamp: new Date(metric.timestamp).getTime(),
        });
      }

      call.end();
    } catch (error) {
      logger.error('gRPC QueryMetrics error:', error);
      call.destroy(error as Error);
    }
  }

  // Logs Service Implementations
  private async submitLog(
    call: grpc.ServerUnaryCall<GrpcLogRequest, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      const request = call.request;
      
      const logData = {
        level: request.level,
        message: request.message,
        service: request.service,
        timestamp: request.timestamp ? new Date(request.timestamp).toISOString() : new Date().toISOString(),
        tags: request.tags || {},
      };

      const log = await logsService.storeLog(logData);

      callback(null, {
        success: true,
        message: 'Log submitted successfully',
        log_id: log,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('gRPC SubmitLog error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  private submitLogsStream(
    call: grpc.ServerReadableStream<GrpcLogRequest, any>,
    callback: grpc.sendUnaryData<any>
  ): void {
    const logs: any[] = [];
    let processedCount = 0;

    call.on('data', async (request: GrpcLogRequest) => {
      try {
        const logData = {
          level: request.level,
          message: request.message,
          service: request.service,
          timestamp: request.timestamp ? new Date(request.timestamp).toISOString() : new Date().toISOString(),
          tags: request.tags || {},
        };

        const log = await logsService.storeLog(logData);
        logs.push(log);
        processedCount++;
      } catch (error) {
        logger.error('Error processing log in stream:', error);
      }
    });

    call.on('end', () => {
      callback(null, {
        success: true,
        message: `Processed ${processedCount} logs successfully`,
        log_id: '',
        timestamp: Date.now(),
      });
    });

    call.on('error', (error) => {
      logger.error('gRPC SubmitLogsStream error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: error instanceof Error ? error.message : 'Stream processing error',
      });
    });
  }

  private async queryLogs(
    call: grpc.ServerWritableStream<GrpcLogQuery, any>
  ): Promise<void> {
    try {
      const query = call.request;
      
      const queryParams: any = {};
      if (query.service) queryParams.service = query.service;
      if (query.level) queryParams.level = query.level;
      if (query.start_time) queryParams.start = new Date(query.start_time).toISOString();
      if (query.end_time) queryParams.end = new Date(query.end_time).toISOString();
      if (query.search) queryParams.search = query.search;
      if (query.limit) queryParams.limit = query.limit;
      if (query.offset) queryParams.page = Math.floor(query.offset / (query.limit || 100)) + 1;

      const result = await logsService.getLogs(queryParams);

      // Stream results back to client
      for (const log of result.logs) {
        call.write({
          success: true,
          message: 'Log data',
          log_id: log.id,
          timestamp: new Date(log.timestamp).getTime(),
        });
      }

      call.end();
    } catch (error) {
      logger.error('gRPC QueryLogs error:', error);
      call.destroy(error as Error);
    }
  }

  // Health Service Implementations
  private async healthCheck(
    call: grpc.ServerUnaryCall<GrpcHealthCheckRequest, any>,
    callback: grpc.sendUnaryData<any>
  ): Promise<void> {
    try {
      // Simple health check - could be expanded to check dependencies
      callback(null, {
        status: 1, // SERVING
        message: 'gRPC service is healthy',
        details: {
          grpc_server: 'healthy',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('gRPC HealthCheck error:', error);
      callback({
        code: grpc.status.INTERNAL,
        message: 'Health check failed',
      });
    }
  }

  private healthWatch(
    call: grpc.ServerWritableStream<GrpcHealthCheckRequest, any>
  ): void {
    // Send initial health status
    call.write({
      status: 1, // SERVING
      message: 'gRPC service is healthy',
      details: {
        grpc_server: 'healthy',
        timestamp: new Date().toISOString(),
      },
    });

    // Send periodic health updates
    const healthInterval = setInterval(() => {
      try {
        call.write({
          status: 1, // SERVING
          message: 'gRPC service is healthy',
          details: {
            grpc_server: 'healthy',
            timestamp: new Date().toISOString(),
          },
        });
      } catch (error) {
        logger.error('Health watch error:', error);
        clearInterval(healthInterval);
        call.destroy();
      }
    }, 30000); // Send health update every 30 seconds

    call.on('cancelled', () => {
      clearInterval(healthInterval);
      logger.info('Health watch stream cancelled by client');
    });

    call.on('error', (error) => {
      clearInterval(healthInterval);
      logger.error('Health watch stream error:', error);
    });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.bindAsync(
        `0.0.0.0:${this.port}`,
        grpc.ServerCredentials.createInsecure(),
        (error, port) => {
          if (error) {
            logger.error('Failed to start gRPC server:', error);
            reject(error);
            return;
          }

          this.server.start();
          logger.info(`gRPC server started on port ${port}`);
          resolve();
        }
      );
    });
  }

  public async stop(): Promise<void> {
    return new Promise((resolve) => {
      this.server.tryShutdown((error) => {
        if (error) {
          logger.error('Error stopping gRPC server:', error);
          this.server.forceShutdown();
        }
        logger.info('gRPC server stopped');
        resolve();
      });
    });
  }
}

export const grpcServer = new GrpcServer(parseInt(process.env.GRPC_PORT || '50051'));