import { Request, Response } from 'express';
import {
  handleRequest,
  createRequestHandler,
  sendSuccess,
  sendError,
  sendNoContent,
  sendCreated,
  sendAccepted,
  validateRequest,
  createValidationSchema,
  createToolExecutionSchema,
  createPromptExecutionSchema,
  createError,
  ErrorCode,
  MCPError,
} from '../../../src/mcp/handlers';

// Mock Express request and response
const mockRequest = () => {
  const req: Partial<Request> = {
    headers: {},
    body: {},
    query: {},
    params: {},
  };
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    req: {
      headers: {},
    } as any,
  };
  return res as Response;
};

describe('MCP Handlers', () => {
  describe('Response Handler', () => {
    it('should send a success response', () => {
      const req = mockRequest();
      const res = mockResponse();
      res.req.headers['x-request-id'] = 'test-request-id';
      
      const data = { test: 'data' };
      sendSuccess(res, data);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: expect.objectContaining({
          requestId: 'test-request-id',
          timestamp: expect.any(String),
        }),
      });
    });
    
    it('should send an error response', () => {
      const req = mockRequest();
      const res = mockResponse();
      res.req.headers['x-request-id'] = 'test-request-id';
      
      const error = createError(ErrorCode.VALIDATION_ERROR, 'Test error');
      sendError(res, error, 400);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error,
        meta: expect.objectContaining({
          requestId: 'test-request-id',
          timestamp: expect.any(String),
        }),
      });
    });
    
    it('should send a no content response', () => {
      const res = mockResponse();
      sendNoContent(res);
      
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
    });
    
    it('should send a created response', () => {
      const req = mockRequest();
      const res = mockResponse();
      res.req.headers['x-request-id'] = 'test-request-id';
      
      const data = { id: 'new-resource' };
      sendCreated(res, data);
      
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: expect.objectContaining({
          requestId: 'test-request-id',
          timestamp: expect.any(String),
        }),
      });
    });
    
    it('should send an accepted response', () => {
      const req = mockRequest();
      const res = mockResponse();
      res.req.headers['x-request-id'] = 'test-request-id';
      
      const data = { status: 'processing' };
      sendAccepted(res, data);
      
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data,
        meta: expect.objectContaining({
          requestId: 'test-request-id',
          timestamp: expect.any(String),
        }),
      });
    });
  });
  
  describe('Error Handler', () => {
    it('should create an MCPError with the correct properties', () => {
      const error = new MCPError(
        ErrorCode.VALIDATION_ERROR,
        'Test error',
        { field: 'test' },
        { recoverable: true, retryable: true }
      );
      
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test error');
      expect(error.context).toEqual({ field: 'test' });
      expect(error.recovery).toEqual({
        recoverable: true,
        retryable: true,
        alternatives: undefined,
        suggestedAction: undefined,
      });
    });
    
    it('should create an error response with default message if not provided', () => {
      const error = createError(ErrorCode.NOT_FOUND);
      
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('Resource not found');
    });
    
    it('should create an error response with custom message', () => {
      const error = createError(
        ErrorCode.TOOL_NOT_FOUND,
        'Custom tool not found message'
      );
      
      expect(error.code).toBe(ErrorCode.TOOL_NOT_FOUND);
      expect(error.message).toBe('Custom tool not found message');
    });
  });
  
  describe('Validation Handler', () => {
    it('should create a validation schema', () => {
      const schema = createValidationSchema(
        { name: 'string' },
        { page: 'number' },
        { id: 'string' }
      );
      
      expect(schema).toEqual({
        body: { name: 'string' },
        query: { page: 'number' },
        params: { id: 'string' },
      });
    });
    
    it('should create a tool execution schema', () => {
      const schema = createToolExecutionSchema();
      
      expect(schema.body).toBeDefined();
      expect(schema.body.toolName).toBeDefined();
      expect(schema.body.arguments).toBeDefined();
    });
    
    it('should create a prompt execution schema', () => {
      const schema = createPromptExecutionSchema();
      
      expect(schema.body).toBeDefined();
      expect(schema.body.promptId).toBeDefined();
      expect(schema.body.arguments).toBeDefined();
    });
  });
});

