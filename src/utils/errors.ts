import { JsonRpcError, McpErrorCode } from '../types/mcp';
import logger from './logger';

/**
 * Custom error class for MCP-specific errors
 */
export class McpError extends Error {
  public readonly code: number;
  public readonly data?: unknown;

  constructor(code: McpErrorCode, message: string, data?: unknown) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.data = data;
  }
}

/**
 * Create a JSON-RPC error response
 */
export function createJsonRpcError(
  code: McpErrorCode,
  message: string,
  data?: unknown
): JsonRpcError {
  return {
    code,
    message,
    data
  };
}

/**
 * Handle and format errors for JSON-RPC responses
 */
export function handleError(error: unknown): JsonRpcError {
  logger.error('Error occurred:', error);

  if (error instanceof McpError) {
    return createJsonRpcError(error.code, error.message, error.data);
  }

  if (error instanceof Error) {
    return createJsonRpcError(
      McpErrorCode.InternalError,
      error.message,
      { stack: error.stack }
    );
  }

  return createJsonRpcError(
    McpErrorCode.InternalError,
    'Unknown error occurred',
    { error: String(error) }
  );
}

/**
 * Validate JSON-RPC request structure
 */
export function validateJsonRpcRequest(request: unknown): request is { jsonrpc: '2.0'; method: string; id?: string | number | null } {
  if (typeof request !== 'object' || request === null) {
    return false;
  }

  const req = request as Record<string, unknown>;
  
  return (
    req['jsonrpc'] === '2.0' &&
    typeof req['method'] === 'string' &&
    (req['id'] === undefined || typeof req['id'] === 'string' || typeof req['id'] === 'number' || req['id'] === null)
  );
}

/**
 * Common error creators
 */
export const errors = {
  parseError: (data?: unknown) => 
    new McpError(McpErrorCode.ParseError, 'Parse error', data),
  
  invalidRequest: (data?: unknown) => 
    new McpError(McpErrorCode.InvalidRequest, 'Invalid Request', data),
  
  methodNotFound: (method: string) => 
    new McpError(McpErrorCode.MethodNotFound, `Method not found: ${method}`),
  
  invalidParams: (message: string = 'Invalid params') => 
    new McpError(McpErrorCode.InvalidParams, message),
  
  toolNotFound: (toolName: string) => 
    new McpError(McpErrorCode.ToolNotFound, `Tool not found: ${toolName}`),
  
  toolExecutionError: (toolName: string, message: string) => 
    new McpError(McpErrorCode.ToolExecutionError, `Tool execution failed for ${toolName}: ${message}`)
}; 