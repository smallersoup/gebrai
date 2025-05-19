import request from 'supertest';
import express from 'express';
import { mcpRouter } from '../../src/mcp/routes';
import { mcpServer } from '../../src/mcp/server';

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

