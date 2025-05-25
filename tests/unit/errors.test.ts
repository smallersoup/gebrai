import {
  McpError,
  createJsonRpcError,
  handleError,
  validateJsonRpcRequest,
  errors
} from '../../src/utils/errors';
import { McpErrorCode } from '../../src/types/mcp';

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

describe('Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('McpError', () => {
    it('should create error with code and message', () => {
      const error = new McpError(McpErrorCode.InvalidRequest, 'Test error');
      
      expect(error.name).toBe('McpError');
      expect(error.code).toBe(McpErrorCode.InvalidRequest);
      expect(error.message).toBe('Test error');
      expect(error.data).toBeUndefined();
    });

    it('should create error with code, message, and data', () => {
      const errorData = { details: 'Additional error details' };
      const error = new McpError(McpErrorCode.ToolExecutionError, 'Test error', errorData);
      
      expect(error.name).toBe('McpError');
      expect(error.code).toBe(McpErrorCode.ToolExecutionError);
      expect(error.message).toBe('Test error');
      expect(error.data).toEqual(errorData);
    });

    it('should be instance of Error', () => {
      const error = new McpError(McpErrorCode.InternalError, 'Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(McpError);
    });
  });

  describe('createJsonRpcError', () => {
    it('should create JSON-RPC error without data', () => {
      const error = createJsonRpcError(McpErrorCode.ParseError, 'Parse failed');
      
      expect(error).toEqual({
        code: McpErrorCode.ParseError,
        message: 'Parse failed',
        data: undefined
      });
    });

    it('should create JSON-RPC error with data', () => {
      const errorData = { position: 10 };
      const error = createJsonRpcError(McpErrorCode.ParseError, 'Parse failed', errorData);
      
      expect(error).toEqual({
        code: McpErrorCode.ParseError,
        message: 'Parse failed',
        data: errorData
      });
    });
  });

  describe('handleError', () => {
    const mockLogger = require('../../src/utils/logger');

    it('should handle McpError', () => {
      const mcpError = new McpError(McpErrorCode.MethodNotFound, 'Method not found', { method: 'test' });
      
      const result = handleError(mcpError);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred:', mcpError);
      expect(result).toEqual({
        code: McpErrorCode.MethodNotFound,
        message: 'Method not found',
        data: { method: 'test' }
      });
    });

    it('should handle standard Error', () => {
      const standardError = new Error('Standard error message');
      standardError.stack = 'Error stack trace';
      
      const result = handleError(standardError);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred:', standardError);
      expect(result).toEqual({
        code: McpErrorCode.InternalError,
        message: 'Standard error message',
        data: { stack: 'Error stack trace' }
      });
    });

    it('should handle unknown error types', () => {
      const unknownError = 'String error';
      
      const result = handleError(unknownError);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred:', unknownError);
      expect(result).toEqual({
        code: McpErrorCode.InternalError,
        message: 'Unknown error occurred',
        data: { error: 'String error' }
      });
    });

    it('should handle null error', () => {
      const result = handleError(null);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred:', null);
      expect(result).toEqual({
        code: McpErrorCode.InternalError,
        message: 'Unknown error occurred',
        data: { error: 'null' }
      });
    });

    it('should handle undefined error', () => {
      const result = handleError(undefined);
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error occurred:', undefined);
      expect(result).toEqual({
        code: McpErrorCode.InternalError,
        message: 'Unknown error occurred',
        data: { error: 'undefined' }
      });
    });
  });

  describe('validateJsonRpcRequest', () => {
    it('should validate correct JSON-RPC request', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: 'test_method',
        id: 1
      };
      
      expect(validateJsonRpcRequest(validRequest)).toBe(true);
    });

    it('should validate request without id', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: 'test_method'
      };
      
      expect(validateJsonRpcRequest(validRequest)).toBe(true);
    });

    it('should validate request with string id', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: 'test_method',
        id: 'string-id'
      };
      
      expect(validateJsonRpcRequest(validRequest)).toBe(true);
    });

    it('should validate request with null id', () => {
      const validRequest = {
        jsonrpc: '2.0' as const,
        method: 'test_method',
        id: null
      };
      
      expect(validateJsonRpcRequest(validRequest)).toBe(true);
    });

    it('should reject request with wrong jsonrpc version', () => {
      const invalidRequest = {
        jsonrpc: '1.0',
        method: 'test_method',
        id: 1
      };
      
      expect(validateJsonRpcRequest(invalidRequest)).toBe(false);
    });

    it('should reject request without method', () => {
      const invalidRequest = {
        jsonrpc: '2.0',
        id: 1
      };
      
      expect(validateJsonRpcRequest(invalidRequest)).toBe(false);
    });

    it('should reject request with non-string method', () => {
      const invalidRequest = {
        jsonrpc: '2.0',
        method: 123,
        id: 1
      };
      
      expect(validateJsonRpcRequest(invalidRequest)).toBe(false);
    });

    it('should reject null request', () => {
      expect(validateJsonRpcRequest(null)).toBe(false);
    });

    it('should reject undefined request', () => {
      expect(validateJsonRpcRequest(undefined)).toBe(false);
    });

    it('should reject non-object request', () => {
      expect(validateJsonRpcRequest('string')).toBe(false);
      expect(validateJsonRpcRequest(123)).toBe(false);
      expect(validateJsonRpcRequest(true)).toBe(false);
    });

    it('should reject request with invalid id type', () => {
      const invalidRequest = {
        jsonrpc: '2.0' as const,
        method: 'test_method',
        id: {}
      };
      
      expect(validateJsonRpcRequest(invalidRequest)).toBe(false);
    });
  });

  describe('errors object', () => {
    it('should create parseError', () => {
      const error = errors.parseError();
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.ParseError);
      expect(error.message).toBe('Parse error');
      expect(error.data).toBeUndefined();
    });

    it('should create parseError with data', () => {
      const errorData = { position: 10 };
      const error = errors.parseError(errorData);
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.ParseError);
      expect(error.message).toBe('Parse error');
      expect(error.data).toEqual(errorData);
    });

    it('should create invalidRequest', () => {
      const error = errors.invalidRequest();
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.InvalidRequest);
      expect(error.message).toBe('Invalid Request');
      expect(error.data).toBeUndefined();
    });

    it('should create invalidRequest with data', () => {
      const errorData = { field: 'missing' };
      const error = errors.invalidRequest(errorData);
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.InvalidRequest);
      expect(error.message).toBe('Invalid Request');
      expect(error.data).toEqual(errorData);
    });

    it('should create methodNotFound', () => {
      const error = errors.methodNotFound('test_method');
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.MethodNotFound);
      expect(error.message).toBe('Method not found: test_method');
    });

    it('should create invalidParams with default message', () => {
      const error = errors.invalidParams();
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.InvalidParams);
      expect(error.message).toBe('Invalid params');
    });

    it('should create invalidParams with custom message', () => {
      const error = errors.invalidParams('Missing required parameter');
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.InvalidParams);
      expect(error.message).toBe('Missing required parameter');
    });

    it('should create toolNotFound', () => {
      const error = errors.toolNotFound('geogebra_test');
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.ToolNotFound);
      expect(error.message).toBe('Tool not found: geogebra_test');
    });

    it('should create toolExecutionError', () => {
      const error = errors.toolExecutionError('geogebra_eval', 'Command failed');
      
      expect(error).toBeInstanceOf(McpError);
      expect(error.code).toBe(McpErrorCode.ToolExecutionError);
      expect(error.message).toBe('Tool execution failed for geogebra_eval: Command failed');
    });
  });
}); 