import request from 'supertest';
import express from 'express';
import { mcpRouter, mcpErrorHandler } from '../../src/mcp/routes';
import { mcpServer } from '../../src/mcp/server';
import { ErrorCode, createError } from '../../src/mcp/handlers';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Health Check Endpoint', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use('/mcp', mcpRouter);
  });

  it('should return 200 OK with server status', async () => {
    // Mock the getStatus method
    const mockStatus = {
      status: 'ok',
      initialized: false,
      uptime: 0,
      connections: {
        active: 0,
        total: 0,
      },
      resources: {
        count: 0,
      },
      subscriptions: {
        count: 0,
      },
      memory: {
        rss: 0,
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        arrayBuffers: 0,
      },
    };
    
    jest.spyOn(mcpServer, 'getStatus').mockReturnValue(mockStatus);

    const response = await request(app).get('/mcp/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockStatus);
  });
});

describe('MCP Error Handler', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    
    // Create a test route that throws an error
    app.get('/test-error', (req, res, next) => {
      next(createError(ErrorCode.INTERNAL_ERROR, 'Test error'));
    });
    
    // Apply the error handler
    app.use(mcpErrorHandler);
  });

  it('should handle MCP errors correctly', async () => {
    const response = await request(app).get('/test-error');
    
    expect(response.status).toBe(500); // Internal error status code
    expect(response.body).toHaveProperty('error');
    expect(response.body.error).toHaveProperty('code', ErrorCode.INTERNAL_ERROR);
    expect(response.body.error).toHaveProperty('message', 'Test error');
  });
});
