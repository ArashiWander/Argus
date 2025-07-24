import { Router, Request, Response } from 'express';
import { tracingService, TraceSpan } from '../services/tracingService';
import { authenticateToken, optionalAuth, AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

// Submit single trace span
router.post('/spans', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      trace_id,
      span_id,
      parent_id,
      operation_name,
      service_name,
      start_time,
      end_time,
      duration_ms,
      status,
      tags,
      logs,
    } = req.body;

    // Validate required fields
    if (!operation_name || !service_name) {
      return res.status(400).json({
        error: 'Missing required fields: operation_name, service_name'
      });
    }

    const spanData: Partial<TraceSpan> = {
      id: span_id,
      trace_id,
      parent_id,
      operation_name,
      service_name,
      start_time,
      end_time,
      duration_ms,
      status,
      tags: tags || {},
      logs: logs || [],
    };

    const span = await tracingService.submitSpan(spanData);
    res.status(201).json({ span, message: 'Span submitted successfully' });
  } catch (error: any) {
    logger.error('Failed to submit span:', error);
    res.status(500).json({ error: error.message || 'Failed to submit span' });
  }
});

// Submit bulk trace spans
router.post('/spans/bulk', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { spans } = req.body;

    if (!Array.isArray(spans) || spans.length === 0) {
      return res.status(400).json({ error: 'Spans array is required and must not be empty' });
    }

    // Validate each span has required fields
    for (const [index, span] of spans.entries()) {
      if (!span.operation_name || !span.service_name) {
        return res.status(400).json({
          error: `Span at index ${index} missing required fields: operation_name, service_name`
        });
      }
    }

    const submittedSpans = await tracingService.submitSpans(spans);
    res.status(201).json({ 
      spans: submittedSpans, 
      count: submittedSpans.length,
      message: 'Spans submitted successfully' 
    });
  } catch (error: any) {
    logger.error('Failed to submit bulk spans:', error);
    res.status(500).json({ error: error.message || 'Failed to submit bulk spans' });
  }
});

// Get traces with optional filtering
router.get('/', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      service, 
      operation, 
      status, 
      start, 
      end, 
      limit 
    } = req.query;

    const traces = await tracingService.getTraces(
      service as string,
      operation as string,
      status as string,
      start as string,
      end as string,
      parseInt(limit as string) || 100
    );

    res.json({ traces, count: traces.length });
  } catch (error: any) {
    logger.error('Failed to fetch traces:', error);
    res.status(500).json({ error: 'Failed to fetch traces' });
  }
});

// Get specific trace by ID
router.get('/:traceId', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { traceId } = req.params;

    const trace = await tracingService.getTrace(traceId);
    if (!trace) {
      return res.status(404).json({ error: 'Trace not found' });
    }

    res.json({ trace });
  } catch (error: any) {
    logger.error('Failed to fetch trace:', error);
    res.status(500).json({ error: 'Failed to fetch trace' });
  }
});

// Get spans for a specific trace
router.get('/:traceId/spans', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { traceId } = req.params;

    const spans = await tracingService.getTraceSpans(traceId);
    res.json({ spans, count: spans.length });
  } catch (error: any) {
    logger.error('Failed to fetch trace spans:', error);
    res.status(500).json({ error: 'Failed to fetch trace spans' });
  }
});

// Get service dependencies
router.get('/dependencies/services', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { service } = req.query;

    const dependencies = await tracingService.getServiceDependencies(service as string);
    res.json({ dependencies, count: dependencies.length });
  } catch (error: any) {
    logger.error('Failed to fetch service dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch service dependencies' });
  }
});

// Get tracing statistics
router.get('/stats/overview', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await tracingService.getTracingStats();
    res.json(stats);
  } catch (error: any) {
    logger.error('Failed to fetch tracing statistics:', error);
    res.status(500).json({ error: 'Failed to fetch tracing statistics' });
  }
});

// OpenTelemetry-compatible trace export endpoint
router.post('/v1/traces', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { resourceSpans } = req.body;

    if (!resourceSpans || !Array.isArray(resourceSpans)) {
      return res.status(400).json({ error: 'Invalid OpenTelemetry trace format' });
    }

    const spans: Partial<TraceSpan>[] = [];

    // Parse OpenTelemetry format
    for (const resourceSpan of resourceSpans) {
      const serviceName = resourceSpan.resource?.attributes?.find(
        (attr: any) => attr.key === 'service.name'
      )?.value?.stringValue || 'unknown';

      for (const scopeSpan of resourceSpan.scopeSpans || []) {
        for (const span of scopeSpan.spans || []) {
          const spanData: Partial<TraceSpan> = {
            id: Buffer.from(span.spanId, 'hex').toString('hex'),
            trace_id: Buffer.from(span.traceId, 'hex').toString('hex'),
            parent_id: span.parentSpanId ? Buffer.from(span.parentSpanId, 'hex').toString('hex') : undefined,
            operation_name: span.name,
            service_name: serviceName,
            start_time: new Date(parseInt(span.startTimeUnixNano) / 1000000).toISOString(),
            end_time: new Date(parseInt(span.endTimeUnixNano) / 1000000).toISOString(),
            status: span.status?.code === 2 ? 'error' : 'ok',
            tags: {},
            logs: [],
          };

          // Extract attributes as tags
          if (span.attributes) {
            for (const attr of span.attributes) {
              spanData.tags![attr.key] = attr.value?.stringValue || attr.value?.intValue || attr.value?.boolValue;
            }
          }

          // Extract events as logs
          if (span.events) {
            spanData.logs = span.events.map((event: any) => ({
              timestamp: new Date(parseInt(event.timeUnixNano) / 1000000).toISOString(),
              fields: {
                name: event.name,
                ...event.attributes?.reduce((acc: any, attr: any) => {
                  acc[attr.key] = attr.value?.stringValue || attr.value?.intValue || attr.value?.boolValue;
                  return acc;
                }, {}),
              },
            }));
          }

          spans.push(spanData);
        }
      }
    }

    if (spans.length > 0) {
      await tracingService.submitSpans(spans);
    }

    res.status(200).json({ message: 'Traces exported successfully', count: spans.length });
  } catch (error: any) {
    logger.error('Failed to export OpenTelemetry traces:', error);
    res.status(500).json({ error: 'Failed to export traces' });
  }
});

export { router as tracingRoutes };