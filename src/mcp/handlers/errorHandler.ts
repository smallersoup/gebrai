import { Request, Response, NextFunction } from 'express';
import { logger } from '../../utils/logger';
import { ErrorResponse } from '../types';
import { ErrorCode, ErrorStatusMap, ErrorMessages } from './types';
import { sendError } from './responseHandler';

/**
 * Custom error class for MCP operations
 */
export class MCPError extends Error {
  code: ErrorCode;
  statusCode: number;
  context?: any;
  recovery?: {
    recoverable: boolean;
    retryable: boolean;
    alternatives?: string[];
    suggestedAction?: string;
  };

  constructor(
    code: ErrorCode,
    message?: string,
    context?: any,
    recovery?: {
      recoverable?: boolean;
      retryable?: boolean;
      alternatives?: string[];
      suggestedAction?: string;
    }
  ) {
    super(message || ErrorMessages[code]);
    this.code = code;
    this.statusCode = ErrorStatusMap[code];
    this.context = context;
    this.recovery = {
      recoverable: recovery?.recoverable ?? false,
      retryable: recovery?.retryable ?? false,
      alternatives: recovery?.alternatives,
      suggestedAction: recovery?.suggestedAction,
    };
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert to a standard error response
   * @returns Error response object
   */
  toErrorResponse(): ErrorResponse {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      recovery: this.recovery,
    };
  }
}

/**
 * Create a standard error response
 * @param code Error code
 * @param message Error message (optional, defaults to standard message for the code)
 * @param context Additional context (optional)
 * @param recovery Recovery options (optional)
 * @returns Error response object
 */
export function createError(
  code: ErrorCode,
  message?: string,
  context?: any,
  recovery?: {
    recoverable?: boolean;
    retryable?: boolean;
    alternatives?: string[];
    suggestedAction?: string;
  }
): ErrorResponse {
  return new MCPError(code, message, context, recovery).toErrorResponse();
}

/**
 * Global error handler middleware for MCP routes
 */
export function mcpErrorHandler(
  err: Error | MCPError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const requestId = req.headers['x-request-id'] as string;
  
  // Log the error
  logger.error(`Error in request ${requestId}: ${err.message}`, {
    requestId,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  // Handle MCP errors
  if (err instanceof MCPError) {
    sendError(res, err.toErrorResponse(), err.statusCode);
    return;
  }
  
  // Handle unknown errors
  const internalError = createError(
    ErrorCode.INTERNAL_ERROR,
    'An unexpected error occurred',
    { originalError: err.message }
  );
  
  sendError(res, internalError, ErrorStatusMap[ErrorCode.INTERNAL_ERROR]);
}

