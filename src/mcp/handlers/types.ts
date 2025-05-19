import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

/**
 * Standard error codes for MCP operations
 */
export enum ErrorCode {
  // General errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // MCP specific errors
  SERVER_NOT_INITIALIZED = 'SERVER_NOT_INITIALIZED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  
  // Tool errors
  TOOL_NOT_FOUND = 'TOOL_NOT_FOUND',
  TOOL_EXECUTION_ERROR = 'TOOL_EXECUTION_ERROR',
  INVALID_TOOL_ARGUMENTS = 'INVALID_TOOL_ARGUMENTS',
  
  // Prompt errors
  PROMPT_NOT_FOUND = 'PROMPT_NOT_FOUND',
  PROMPT_EXECUTION_ERROR = 'PROMPT_EXECUTION_ERROR',
  INVALID_PROMPT_ARGUMENTS = 'INVALID_PROMPT_ARGUMENTS',
  
  // Subscription errors
  SUBSCRIPTION_NOT_FOUND = 'SUBSCRIPTION_NOT_FOUND',
  
  // Math operation errors
  MATH_PARSING_ERROR = 'MATH_PARSING_ERROR',
  MATH_EVALUATION_ERROR = 'MATH_EVALUATION_ERROR',
  MATH_DOMAIN_ERROR = 'MATH_DOMAIN_ERROR',
  MATH_DIVISION_BY_ZERO = 'MATH_DIVISION_BY_ZERO',
}

/**
 * HTTP status codes mapped to error codes
 */
export const ErrorStatusMap: Record<ErrorCode, number> = {
  [ErrorCode.INTERNAL_ERROR]: 500,
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.NOT_FOUND]: 404,
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  
  [ErrorCode.SERVER_NOT_INITIALIZED]: 409,
  [ErrorCode.INVALID_REQUEST]: 400,
  
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  
  [ErrorCode.TOOL_NOT_FOUND]: 404,
  [ErrorCode.TOOL_EXECUTION_ERROR]: 500,
  [ErrorCode.INVALID_TOOL_ARGUMENTS]: 400,
  
  [ErrorCode.PROMPT_NOT_FOUND]: 404,
  [ErrorCode.PROMPT_EXECUTION_ERROR]: 500,
  [ErrorCode.INVALID_PROMPT_ARGUMENTS]: 400,
  
  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: 404,
  
  [ErrorCode.MATH_PARSING_ERROR]: 400,
  [ErrorCode.MATH_EVALUATION_ERROR]: 500,
  [ErrorCode.MATH_DOMAIN_ERROR]: 400,
  [ErrorCode.MATH_DIVISION_BY_ZERO]: 400,
};

/**
 * Standard error messages for error codes
 */
export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
  [ErrorCode.VALIDATION_ERROR]: 'Validation error',
  [ErrorCode.NOT_FOUND]: 'Resource not found',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [ErrorCode.FORBIDDEN]: 'Forbidden',
  
  [ErrorCode.SERVER_NOT_INITIALIZED]: 'MCP server not initialized',
  [ErrorCode.INVALID_REQUEST]: 'Invalid request',
  
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  
  [ErrorCode.TOOL_NOT_FOUND]: 'Tool not found',
  [ErrorCode.TOOL_EXECUTION_ERROR]: 'Tool execution error',
  [ErrorCode.INVALID_TOOL_ARGUMENTS]: 'Invalid tool arguments',
  
  [ErrorCode.PROMPT_NOT_FOUND]: 'Prompt not found',
  [ErrorCode.PROMPT_EXECUTION_ERROR]: 'Prompt execution error',
  [ErrorCode.INVALID_PROMPT_ARGUMENTS]: 'Invalid prompt arguments',
  
  [ErrorCode.SUBSCRIPTION_NOT_FOUND]: 'Subscription not found',
  
  [ErrorCode.MATH_PARSING_ERROR]: 'Error parsing mathematical expression',
  [ErrorCode.MATH_EVALUATION_ERROR]: 'Error evaluating mathematical expression',
  [ErrorCode.MATH_DOMAIN_ERROR]: 'Mathematical domain error',
  [ErrorCode.MATH_DIVISION_BY_ZERO]: 'Division by zero',
};

/**
 * Standard response structure
 */
export interface StandardResponse<T> {
  success: boolean;
  data?: T;
  error?: ErrorResponse;
  meta?: {
    requestId: string;
    timestamp: string;
    [key: string]: any;
  };
}

/**
 * Request handler function type
 */
export type RequestHandlerFn<T = any> = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<T>;

/**
 * Validation schema interface
 */
export interface ValidationSchema {
  body?: any;
  query?: any;
  params?: any;
}

/**
 * Performance metrics for request handling
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
}

