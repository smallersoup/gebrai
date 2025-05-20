import { Request, Response } from 'express';
import { validateRequest, handleJsonParseError } from '../../src/middleware/requestValidator';
import { MCPError, ErrorCode } from '../../src/mcp/handlers/errorHandler';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Request Validator Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.Mock;

  beforeEach(() => {
    req = {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': '100',
      },
      path: '/test',
      body: { test: 'value' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  describe('validateRequest', () => {
    it('should pass valid requests', () => {
      validateRequest(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledWith();
    });

    it('should validate content type for POST requests', () => {
      req.headers = {
        'content-type': 'text/plain',
        'content-length': '100',
      };

      validateRequest(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(MCPError));
      const error = next.mock.calls[0][0] as MCPError;
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toContain('Content-Type');
    });

    it('should validate request body size', () => {
      process.env.MAX_REQUEST_SIZE = '50';
      req.headers = {
        'content-type': 'application/json',
        'content-length': '100',
      };

      validateRequest(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(MCPError));
      const error = next.mock.calls[0][0] as MCPError;
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toContain('too large');
      
      // Reset environment variable
      delete process.env.MAX_REQUEST_SIZE;
    });

    it('should sanitize request body to prevent prototype pollution', () => {
      req.body = {
        test: 'value',
        __proto__: { polluted: true },
        nested: {
          __proto__: { nestedPolluted: true },
        },
      };

      validateRequest(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith();
      expect(req.body.__proto__).toBeUndefined();
      expect(req.body.nested.__proto__).toBeUndefined();
    });

    it('should handle errors gracefully', () => {
      const mockError = new Error('Test error');
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw mockError;
      });

      req.body = '{"invalid": "json"';

      validateRequest(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(MCPError));
      const error = next.mock.calls[0][0] as MCPError;
      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    });
  });

  describe('handleJsonParseError', () => {
    it('should handle JSON parse errors', () => {
      const syntaxError = new SyntaxError('Unexpected token');
      Object.defineProperty(syntaxError, 'body', { value: '{"invalid": "json"' });

      handleJsonParseError(syntaxError, req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(expect.any(MCPError));
      const error = next.mock.calls[0][0] as MCPError;
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toContain('Malformed JSON');
    });

    it('should pass through non-JSON parse errors', () => {
      const error = new Error('Some other error');
      
      handleJsonParseError(error, req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

