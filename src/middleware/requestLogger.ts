import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware to log incoming requests
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Generate a unique request ID
  const requestId = uuidv4();
  req.headers['x-request-id'] = requestId;

  // Log the request
  logger.info(`Request ${requestId}: ${req.method} ${req.path}`, {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Record start time
  const start = Date.now();

  // Log the response when it's sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(
      `Response ${requestId}: ${res.statusCode} ${duration}ms`,
      {
        requestId,
        statusCode: res.statusCode,
        duration,
      },
    );

    // Log performance metrics if response time is too high
    if (duration > 1000) {
      logger.warn(`Slow response ${requestId}: ${duration}ms`, {
        requestId,
        method: req.method,
        path: req.path,
        duration,
      });
    }
  });

  next();
};

