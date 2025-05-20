import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { MCPError, ErrorCode } from '../mcp/handlers/errorHandler';

/**
 * Middleware to validate and sanitize incoming requests
 * This middleware runs before any route-specific validation
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  try {
    // Validate request content type for POST, PUT, and PATCH requests
    const method = req.method.toUpperCase();
    if (['POST', 'PUT', 'PATCH'].includes(method) && req.body && Object.keys(req.body).length > 0) {
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
    // Parse size in bytes, supporting human-readable formats like '1MB'
    const contentLength = parseInt(req.headers['content-length'] as string || '0', 10);
    const maxSizeStr = process.env.MAX_REQUEST_SIZE || '1MB';
    const maxSize = parseByteSize(maxSizeStr);
    
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
 * Parse a byte size string (e.g., '1MB', '500KB') into bytes
 * @param sizeStr Size string to parse
 * @returns Size in bytes
 */
function parseByteSize(sizeStr: string): number {
  const units = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    TB: 1024 * 1024 * 1024 * 1024,
  };
  
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)?$/i);
  if (!match) {
    // Default to 1MB if format is invalid
    return 1024 * 1024;
  }
  
  const size = parseFloat(match[1]);
  const unit = match[2]?.toUpperCase() || 'B';
  
  return size * (units[unit as keyof typeof units] || 1);
}

/**
 * Sanitize an object to prevent prototype pollution
 * @param obj Object to sanitize
 */
function sanitizeObject(obj: Record<string, any>): void {
  // Ensure the object does not have a polluted prototype
  if (Object.prototype.hasOwnProperty.call(obj, '__proto__')) {
    delete obj.__proto__;
  }
  
  // Reset the prototype chain to prevent prototype pollution
  // Check if the object is an array and preserve array prototype if it is
  if (Array.isArray(obj)) {
    Object.setPrototypeOf(obj, Array.prototype);
  } else {
    Object.setPrototypeOf(obj, Object.prototype);
  }
  
  // Recursively sanitize nested objects
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key) && typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Middleware to handle malformed JSON in request body
 */
export function handleJsonParseError(err: Error, req: Request, res: Response, next: NextFunction): void {
  if (err instanceof SyntaxError) {
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
