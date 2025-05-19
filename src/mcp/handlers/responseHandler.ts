import { Response } from 'express';
import { StandardResponse } from './types';
import { ErrorResponse } from '../types';

/**
 * Send a successful response
 * @param res Express response object
 * @param data Response data
 * @param statusCode HTTP status code (default: 200)
 * @param meta Optional metadata
 */
export function sendSuccess<T = any>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, any>
): void {
  const requestId = res.req.headers['x-request-id'] as string;
  
  const response: StandardResponse<T> = {
    success: true,
    data,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send an error response
 * @param res Express response object
 * @param error Error response object
 * @param statusCode HTTP status code (default: 500)
 * @param meta Optional metadata
 */
export function sendError(
  res: Response,
  error: ErrorResponse,
  statusCode = 500,
  meta?: Record<string, any>
): void {
  const requestId = res.req.headers['x-request-id'] as string;
  
  const response: StandardResponse<null> = {
    success: false,
    error,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
  
  res.status(statusCode).json(response);
}

/**
 * Send a no content response (204)
 * @param res Express response object
 */
export function sendNoContent(res: Response): void {
  res.status(204).end();
}

/**
 * Send a created response (201)
 * @param res Express response object
 * @param data Response data
 * @param meta Optional metadata
 */
export function sendCreated<T = any>(
  res: Response,
  data: T,
  meta?: Record<string, any>
): void {
  sendSuccess(res, data, 201, meta);
}

/**
 * Send an accepted response (202)
 * @param res Express response object
 * @param data Response data
 * @param meta Optional metadata
 */
export function sendAccepted<T = any>(
  res: Response,
  data: T,
  meta?: Record<string, any>
): void {
  sendSuccess(res, data, 202, meta);
}

