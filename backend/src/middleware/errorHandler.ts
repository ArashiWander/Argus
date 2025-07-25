import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const { statusCode = 500, message } = err;
  
  logger.error({
    error: {
      message,
      stack: err.stack,
      statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    }
  });

  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : message,
    timestamp: new Date().toISOString(),
    path: req.path
  });
};