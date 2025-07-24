import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { logger } from './config/logger';
import { initializeDatabases, closeDatabases } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { healthRoutes } from './routes/health';
import { metricsRoutes } from './routes/metrics';
import { logsRoutes } from './routes/logs';
import { authRoutes } from './routes/auth';
import { alertRoutes } from './routes/alerts';
import { tracingRoutes } from './routes/tracing';
import { anomalyRoutes } from './routes/anomalies';
import { alertService } from './services/alertService';
import { anomalyDetectionService } from './services/anomalyDetectionService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/tracing', tracingRoutes);
app.use('/api/anomalies', anomalyRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Argus Monitoring Platform',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Start server
const startServer = async () => {
  try {
    // Initialize database connections
    await initializeDatabases();
    
    app.listen(PORT, () => {
      logger.info(`Argus backend server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Start alert evaluation scheduler (every 1 minute)
    const alertEvaluationInterval = setInterval(async () => {
      try {
        await alertService.evaluateAlertRules();
      } catch (error) {
        logger.error('Alert evaluation failed:', error);
      }
    }, 60000); // 1 minute

    // Start anomaly detection scheduler (every 5 minutes)
    const anomalyDetectionInterval = setInterval(async () => {
      try {
        await anomalyDetectionService.detectAnomalies();
      } catch (error) {
        logger.error('Anomaly detection failed:', error);
      }
    }, 300000); // 5 minutes

    // Store interval IDs for cleanup
    process.on('SIGTERM', () => {
      clearInterval(alertEvaluationInterval);
      clearInterval(anomalyDetectionInterval);
    });
    process.on('SIGINT', () => {
      clearInterval(alertEvaluationInterval);
      clearInterval(anomalyDetectionInterval);
    });

    logger.info('Alert evaluation scheduler started (1 minute interval)');
    logger.info('Anomaly detection scheduler started (5 minute interval)');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  await closeDatabases();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;