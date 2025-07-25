import { logger } from '../config/logger';

export interface TraceSpan {
  id: string;
  trace_id: string;
  parent_id?: string;
  operation_name: string;
  service_name: string;
  start_time: string;
  end_time?: string;
  duration_ms?: number;
  status: 'ok' | 'error' | 'timeout';
  tags: Record<string, any>;
  logs: Array<{
    timestamp: string;
    fields: Record<string, any>;
  }>;
  created_at: string;
}

export interface TraceData {
  trace_id: string;
  spans: TraceSpan[];
  services: string[];
  duration_ms: number;
  start_time: string;
  end_time: string;
  status: 'ok' | 'error' | 'timeout';
  root_service: string;
  root_operation: string;
}

export interface ServiceDependency {
  caller_service: string;
  callee_service: string;
  operation: string;
  call_count: number;
  error_count: number;
  avg_duration_ms: number;
  last_called: string;
}

class TracingService {
  private traces: Map<string, TraceData> = new Map();
  private spans: Map<string, TraceSpan> = new Map();
  private dependencies: Map<string, ServiceDependency> = new Map();

  // Submit trace spans (from OpenTelemetry or other sources)
  async submitSpan(spanData: Partial<TraceSpan>): Promise<TraceSpan> {
    try {
      const span: TraceSpan = {
        id: spanData.id || this.generateSpanId(),
        trace_id: spanData.trace_id || this.generateTraceId(),
        parent_id: spanData.parent_id,
        operation_name: spanData.operation_name || 'unknown',
        service_name: spanData.service_name || 'unknown',
        start_time: spanData.start_time || new Date().toISOString(),
        end_time: spanData.end_time,
        duration_ms: spanData.duration_ms,
        status: spanData.status || 'ok',
        tags: spanData.tags || {},
        logs: spanData.logs || [],
        created_at: new Date().toISOString(),
      };

      // Calculate duration if end_time is provided
      if (span.end_time && !span.duration_ms) {
        span.duration_ms = new Date(span.end_time).getTime() - new Date(span.start_time).getTime();
      }

      this.spans.set(span.id, span);
      this.updateTrace(span);
      this.updateServiceDependencies(span);

      logger.info(`Span submitted: ${span.service_name}.${span.operation_name}`, {
        trace_id: span.trace_id,
        span_id: span.id,
        duration_ms: span.duration_ms,
      });

      return span;
    } catch (error) {
      logger.error('Failed to submit span:', error);
      throw new Error('Failed to submit span');
    }
  }

  // Submit bulk spans
  async submitSpans(spansData: Partial<TraceSpan>[]): Promise<TraceSpan[]> {
    try {
      const results: TraceSpan[] = [];
      for (const spanData of spansData) {
        const span = await this.submitSpan(spanData);
        results.push(span);
      }
      return results;
    } catch (error) {
      logger.error('Failed to submit bulk spans:', error);
      throw new Error('Failed to submit bulk spans');
    }
  }

  // Get traces with filtering
  async getTraces(
    service?: string,
    operation?: string,
    status?: string,
    startTime?: string,
    endTime?: string,
    limit = 100
  ): Promise<TraceData[]> {
    try {
      let traces = Array.from(this.traces.values());

      // Apply filters
      if (service) {
        traces = traces.filter(trace => trace.services.includes(service));
      }

      if (operation) {
        traces = traces.filter(trace => 
          trace.spans.some(span => span.operation_name.includes(operation))
        );
      }

      if (status) {
        traces = traces.filter(trace => trace.status === status);
      }

      if (startTime) {
        const start = new Date(startTime);
        traces = traces.filter(trace => new Date(trace.start_time) >= start);
      }

      if (endTime) {
        const end = new Date(endTime);
        traces = traces.filter(trace => new Date(trace.end_time) <= end);
      }

      // Sort by start time (newest first) and limit
      traces.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
      
      return traces.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get traces:', error);
      throw new Error('Failed to get traces');
    }
  }

  // Get specific trace by ID
  async getTrace(traceId: string): Promise<TraceData | null> {
    try {
      return this.traces.get(traceId) || null;
    } catch (error) {
      logger.error('Failed to get trace:', error);
      throw new Error('Failed to get trace');
    }
  }

  // Get trace spans
  async getTraceSpans(traceId: string): Promise<TraceSpan[]> {
    try {
      return Array.from(this.spans.values()).filter(span => span.trace_id === traceId);
    } catch (error) {
      logger.error('Failed to get trace spans:', error);
      throw new Error('Failed to get trace spans');
    }
  }

  // Get service dependencies
  async getServiceDependencies(service?: string): Promise<ServiceDependency[]> {
    try {
      let dependencies = Array.from(this.dependencies.values());
      
      if (service) {
        dependencies = dependencies.filter(dep => 
          dep.caller_service === service || dep.callee_service === service
        );
      }

      return dependencies.sort((a, b) => b.call_count - a.call_count);
    } catch (error) {
      logger.error('Failed to get service dependencies:', error);
      throw new Error('Failed to get service dependencies');
    }
  }

  // Get tracing statistics
  async getTracingStats(): Promise<any> {
    try {
      const allTraces = Array.from(this.traces.values());
      const allSpans = Array.from(this.spans.values());
      const services = new Set(allSpans.map(span => span.service_name));
      const operations = new Set(allSpans.map(span => span.operation_name));

      const errorTraces = allTraces.filter(trace => trace.status === 'error');
      const avgDuration = allTraces.length > 0 
        ? allTraces.reduce((sum, trace) => sum + trace.duration_ms, 0) / allTraces.length 
        : 0;

      return {
        total_traces: allTraces.length,
        total_spans: allSpans.length,
        unique_services: services.size,
        unique_operations: operations.size,
        error_rate: allTraces.length > 0 ? (errorTraces.length / allTraces.length) * 100 : 0,
        avg_duration_ms: Math.round(avgDuration),
        services: Array.from(services),
        operations: Array.from(operations),
      };
    } catch (error) {
      logger.error('Failed to get tracing statistics:', error);
      throw new Error('Failed to get tracing statistics');
    }
  }

  private updateTrace(span: TraceSpan): void {
    const traceId = span.trace_id;
    let trace = this.traces.get(traceId);

    if (!trace) {
      trace = {
        trace_id: traceId,
        spans: [],
        services: [],
        duration_ms: 0,
        start_time: span.start_time,
        end_time: span.end_time || span.start_time,
        status: 'ok',
        root_service: span.service_name,
        root_operation: span.operation_name,
      };
    }

    // Add span to trace
    const existingSpanIndex = trace.spans.findIndex(s => s.id === span.id);
    if (existingSpanIndex >= 0) {
      trace.spans[existingSpanIndex] = span;
    } else {
      trace.spans.push(span);
    }

    // Update services list
    if (!trace.services.includes(span.service_name)) {
      trace.services.push(span.service_name);
    }

    // Update trace timing
    trace.start_time = trace.spans.reduce((earliest, s) => 
      new Date(s.start_time) < new Date(earliest) ? s.start_time : earliest, trace.start_time
    );

    const latestEnd = trace.spans
      .filter(s => s.end_time)
      .reduce((latest, s) => 
        new Date(s.end_time!) > new Date(latest) ? s.end_time! : latest, trace.start_time
      );
    trace.end_time = latestEnd;

    // Calculate total duration
    trace.duration_ms = new Date(trace.end_time).getTime() - new Date(trace.start_time).getTime();

    // Determine trace status
    if (trace.spans.some(s => s.status === 'error')) {
      trace.status = 'error';
    } else if (trace.spans.some(s => s.status === 'timeout')) {
      trace.status = 'timeout';
    }

    // Find root span (span without parent or earliest span)
    const rootSpan = trace.spans.find(s => !s.parent_id) || 
                     trace.spans.reduce((earliest, s) => 
                       new Date(s.start_time) < new Date(earliest.start_time) ? s : earliest
                     );
    
    if (rootSpan) {
      trace.root_service = rootSpan.service_name;
      trace.root_operation = rootSpan.operation_name;
    }

    this.traces.set(traceId, trace);
  }

  private updateServiceDependencies(span: TraceSpan): void {
    // Find parent span to establish dependency
    const parentSpan = Array.from(this.spans.values()).find(s => s.id === span.parent_id);
    
    if (parentSpan && parentSpan.service_name !== span.service_name) {
      const depKey = `${parentSpan.service_name}->${span.service_name}`;
      let dependency = this.dependencies.get(depKey);

      if (!dependency) {
        dependency = {
          caller_service: parentSpan.service_name,
          callee_service: span.service_name,
          operation: span.operation_name,
          call_count: 0,
          error_count: 0,
          avg_duration_ms: 0,
          last_called: span.start_time,
        };
      }

      dependency.call_count++;
      if (span.status === 'error') {
        dependency.error_count++;
      }
      
      if (span.duration_ms) {
        dependency.avg_duration_ms = Math.round(
          (dependency.avg_duration_ms * (dependency.call_count - 1) + span.duration_ms) / dependency.call_count
        );
      }
      
      dependency.last_called = span.start_time;
      this.dependencies.set(depKey, dependency);
    }
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

export const tracingService = new TracingService();