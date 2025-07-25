import { Request, Response, NextFunction } from 'express';
import { securityService } from '../services/securityService';
import { AuthenticatedRequest } from './auth';
import { logger } from '../config/logger';

interface AuditableRequest extends AuthenticatedRequest {
  originalBody?: Record<string, unknown>;
  auditResource?: string;
  auditAction?: string;
}

interface AuditableResponseBody {
  count?: number;
  length?: number;
  id?: string;
  user?: { id?: string };
  rule?: { id?: string };
  alert?: { id?: string };
}

interface CountableBody {
  count?: number;
  length?: number;
}

// Middleware to capture request body for audit
export const captureAuditData = (resource: string, action: string) => {
  return (req: AuditableRequest, res: Response, next: NextFunction) => {
    req.originalBody = { ...req.body };
    req.auditResource = resource;
    req.auditAction = action;
    next();
  };
};

// Middleware to log audit trail after response
export const auditTrailMiddleware = () => {
  return (req: AuditableRequest, res: Response, next: NextFunction) => {
    // Capture original res.json method
    const originalJson = res.json;
    
    res.json = function(body?: unknown) {
      // Log audit trail after successful response
      if (req.auditResource && req.auditAction && req.user) {
        setImmediate(async () => {
          try {
            const outcome = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
            
            await securityService.logAuditTrail({
              user_id: req.user!.userId,
              username: req.user!.username,
              action: req.auditAction!,
              resource: req.auditResource!,
              resource_id: extractResourceId(req, body),
              old_values: extractOldValues(req),
              new_values: extractNewValues(req, body),
              ip_address: getClientIP(req),
              user_agent: req.get('User-Agent'),
              outcome,
              details: {
                method: req.method,
                path: req.path,
                status_code: res.statusCode,
              },
            });
          } catch (error) {
            logger.error('Failed to log audit trail:', error);
          }
        });
      }
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Middleware to log security events for authentication
export const logAuthenticationEvent = (action: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body?: unknown) {
      setImmediate(async () => {
        try {
          const outcome = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
          const severity = outcome === 'failure' ? 'medium' : 'info';
          
          await securityService.logSecurityEvent({
            event_type: 'authentication',
            severity,
            source_ip: getClientIP(req),
            username: req.body?.username,
            action,
            outcome,
            timestamp: new Date().toISOString(),
            details: {
              method: req.method,
              path: req.path,
              user_agent: req.get('User-Agent'),
              status_code: res.statusCode,
            },
          });
        } catch (error) {
          logger.error('Failed to log authentication event:', error);
        }
      });
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Middleware to log security events for authorization
export const logAuthorizationEvent = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body?: unknown) {
      setImmediate(async () => {
        try {
          const outcome = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
          const severity = outcome === 'failure' ? 'high' : 'info';
          
          await securityService.logSecurityEvent({
            event_type: 'authorization',
            severity,
            source_ip: getClientIP(req),
            user_id: req.user?.userId,
            username: req.user?.username,
            resource: req.path,
            action,
            outcome,
            timestamp: new Date().toISOString(),
            details: {
              method: req.method,
              path: req.path,
              user_agent: req.get('User-Agent'),
              status_code: res.statusCode,
              required_role: extractRequiredRole(req),
            },
          });
        } catch (error) {
          logger.error('Failed to log authorization event:', error);
        }
      });
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Middleware to log data access events
export const logDataAccessEvent = (resource: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body?: unknown) {
      setImmediate(async () => {
        try {
          const outcome = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
          const severity = req.method === 'GET' ? 'info' : 'medium';
          
          await securityService.logSecurityEvent({
            event_type: 'data_access',
            severity,
            source_ip: getClientIP(req),
            user_id: req.user?.userId,
            username: req.user?.username,
            resource,
            action: `${req.method.toLowerCase()}_${resource}`,
            outcome,
            timestamp: new Date().toISOString(),
            details: {
              method: req.method,
              path: req.path,
              user_agent: req.get('User-Agent'),
              status_code: res.statusCode,
              query_params: req.query,
              data_count: getDataCount(body),
            },
          });
        } catch (error) {
          logger.error('Failed to log data access event:', error);
        }
      });
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Middleware to log system change events
export const logSystemChangeEvent = (resource: string, action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(body?: unknown) {
      setImmediate(async () => {
        try {
          const outcome = res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'failure';
          const severity = ['DELETE', 'PUT', 'PATCH'].includes(req.method) ? 'high' : 'medium';
          
          await securityService.logSecurityEvent({
            event_type: 'system_change',
            severity,
            source_ip: getClientIP(req),
            user_id: req.user?.userId,
            username: req.user?.username,
            resource,
            action,
            outcome,
            timestamp: new Date().toISOString(),
            details: {
              method: req.method,
              path: req.path,
              user_agent: req.get('User-Agent'),
              status_code: res.statusCode,
              changes: req.body,
            },
          });
        } catch (error) {
          logger.error('Failed to log system change event:', error);
        }
      });
      
      return originalJson.call(this, body);
    };
    
    next();
  };
};

// Helper functions
function getClientIP(req: Request): string {
  return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         'unknown';
}

function getDataCount(body: unknown): number {
  if (body && typeof body === 'object') {
    const countableBody = body as CountableBody;
    return countableBody.count || countableBody.length || 1;
  }
  return 1;
}

function extractResourceId(req: AuditableRequest, responseBody?: unknown): string | undefined {
  // Try to extract resource ID from URL params
  if (req.params.id) {
    return req.params.id;
  }
  
  // Try to extract from response body
  if (responseBody && typeof responseBody === 'object') {
    const auditableBody = responseBody as AuditableResponseBody;
    return auditableBody.id || auditableBody.user?.id || auditableBody.rule?.id || auditableBody.alert?.id;
  }
  
  return undefined;
}

function extractOldValues(req: AuditableRequest): Record<string, unknown> | undefined {
  // In a real implementation, this would fetch the current state before modification
  // For now, we'll just return undefined for new records
  if (req.method === 'POST') {
    return undefined;
  }
  
  return {}; // Placeholder - would need to be implemented based on specific requirements
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function extractNewValues(req: AuditableRequest, responseBody?: unknown): Record<string, unknown> | undefined {
  if (req.method === 'DELETE') {
    return undefined;
  }
  
  if (req.originalBody && Object.keys(req.originalBody).length > 0) {
    return req.originalBody;
  }
  
  return undefined;
}

function extractRequiredRole(req: AuthenticatedRequest): string | undefined {
  // This would be set by the requireRole middleware
  return (req as any).requiredRole;
}

// Export convenience middleware combinations
export const auditableEndpoint = (resource: string, action: string) => [
  captureAuditData(resource, action),
  auditTrailMiddleware(),
];

export const secureDataAccess = (resource: string) => [
  logDataAccessEvent(resource),
];

export const secureSystemChange = (resource: string, action: string) => [
  ...auditableEndpoint(resource, action),
  logSystemChangeEvent(resource, action),
];