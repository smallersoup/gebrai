import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { MCPError, ErrorCode } from '../mcp/handlers/errorHandler';

/**
 * Middleware to validate and sanitize incoming requests
 * This middleware runs before any route-specific validation
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    // Validate request content type for POST requests
    if (req.method === 'POST' && req.body && Object.keys(req.body).length > 0) {
      const contentType = req.headers['content-type'] || '';
      
      if (!contentType.includes('application/json')) {
        logger.warn('Invalid content type', {
          contentType,
          path: req.path,
          method: req.method,
        });
        
        return next(new MCPError(
          ErrorCode.VALIDATION_ERROR,
          'Content-Type must be application/json',
          { contentType }
        ));
      }
    }
    
    // Validate request body size
    const contentLength = parseInt(req.headers['content-length'] as string || '0', 10);
    const maxSize = parseInt(process.env.MAX_REQUEST_SIZE || '1048576', 10); // Default: 1MB
    
    if (contentLength > maxSize) {
      logger.warn('Request body too large', {
        contentLength,
        maxSize,
        path: req.path,
        method: req.method,
      });
      
      return next(new MCPError(
        ErrorCode.VALIDATION_ERROR,
        'Request body too large',
        { contentLength, maxSize }
      ));
    }
    
    // Sanitize request body to prevent prototype pollution
    if (req.body && typeof req.body === 'object') {
      sanitizeObject(req.body);
    }
    
    // Continue to the next middleware
    next();
  } catch (error) {
    logger.error('Error in request validation middleware', { error });
    next(new MCPError(
      ErrorCode.INTERNAL_ERROR,
      'Error processing request',
      { originalError: error }
    ));
  }
}

/**
 * Sanitize an object to prevent prototype pollution
 * @param obj Object to sanitize
 */
function sanitizeObject(obj: Record<string, any>): void {
  // Prevent prototype pollution
  if (obj.__proto__ !== undefined) {
    delete obj.__proto__;
  }
  
  if (obj.constructor !== undefined) {
    delete obj.constructor;
  }
  
  if (obj.prototype !== undefined) {
    delete obj.prototype;
  }
  
  // Recursively sanitize nested objects
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Middleware to handle malformed JSON in request body
 */
export function handleJsonParseError(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof SyntaxError && 'body' in err) {
    logger.warn('Malformed JSON in request body', {
      error: err.message,
      path: req.path,
      method: req.method,
    });
    
    return next(new MCPError(
      ErrorCode.VALIDATION_ERROR,
      'Malformed JSON in request body',
      { originalError: err.message }
    ));
  }
  
  next(err);
}

