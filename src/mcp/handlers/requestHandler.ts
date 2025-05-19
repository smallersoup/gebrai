import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { RequestHandlerFn, PerformanceMetrics, ValidationSchema } from './types';
import { validateRequest } from './validationHandler';

/**
 * Wrap a request handler with standardized processing
 * @param handler The handler function to wrap
 * @param validationSchema Optional schema for request validation
 * @returns Express middleware function
 */
export function handleRequest<T = any>(
  handler: RequestHandlerFn<T>,
  validationSchema?: ValidationSchema
): (req: Request, res: Response, next: NextFunction) => void {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Generate a unique request ID if not already present
    const requestId = req.headers['x-request-id'] as string || uuidv4();
    req.headers['x-request-id'] = requestId;
    
    // Initialize performance metrics
    const metrics: PerformanceMetrics = {
      startTime: Date.now(),
    };
    
    try {
      // Log the incoming request
      logger.info(`Request ${requestId}: ${req.method} ${req.path}`, {
        requestId,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      // Validate the request if a schema is provided
      if (validationSchema) {
        const validationResult = validateRequest(req, validationSchema);
        if (!validationResult.valid) {
          return next(validationResult.error);
        }
      }
      
      // Execute the handler
      const result = await handler(req, res, next);
      
      // Complete performance metrics
      metrics.endTime = Date.now();
      metrics.duration = metrics.endTime - metrics.startTime;
      metrics.memoryUsage = process.memoryUsage();
      
      // Log performance metrics
      if (metrics.duration > 1000) {
        logger.warn(`Slow request ${requestId}: ${metrics.duration}ms`, {
          requestId,
          method: req.method,
          path: req.path,
          duration: metrics.duration,
        });
      }
      
      // Return the result
      return result;
    } catch (error) {
      // Pass the error to the next middleware
      next(error);
    }
  };
}

/**
 * Create a request handler for a specific operation
 * @param operationName Name of the operation for logging
 * @param handler The handler function
 * @param validationSchema Optional schema for request validation
 * @returns Express middleware function
 */
export function createRequestHandler<T = any>(
  operationName: string,
  handler: RequestHandlerFn<T>,
  validationSchema?: ValidationSchema
): (req: Request, res: Response, next: NextFunction) => void {
  return handleRequest(async (req, res, next) => {
    const requestId = req.headers['x-request-id'] as string;
    
    logger.info(`Executing operation: ${operationName}`, {
      requestId,
      operation: operationName,
    });
    
    return handler(req, res, next);
  }, validationSchema);
}

