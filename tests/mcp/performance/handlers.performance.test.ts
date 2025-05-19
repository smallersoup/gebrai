import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';
import { mcpRouter } from '../../../src/mcp/routes';
import { mcpServer } from '../../../src/mcp/server';
import { mcpErrorHandler } from '../../../src/mcp/handlers';
import { toolRegistry } from '../../../src/mcp/tools/registry';
import { createGraph2DTool } from '../../../src/mcp/tools/createGraph2D';
import { solveEquationTool } from '../../../src/mcp/tools/solveEquation';

// Create a test app
const app = express();
app.use(bodyParser.json());
app.use('/mcp', mcpRouter);
app.use(mcpErrorHandler);

/**
 * Performance benchmark test for MCP handlers
 * 
 * This test measures the response time for various MCP operations
 * to ensure they meet the performance requirements.
 */
describe('MCP Handlers Performance Tests', () => {
  beforeAll(async () => {
    // Register tools
    toolRegistry.registerTool(createGraph2DTool);
    toolRegistry.registerTool(solveEquationTool);
    
    // Initialize the MCP server
    await mcpServer.initialize({
      capabilities: {
        sampling: { supported: true },
        notifications: { supported: true },
      },
      clientInfo: {
        name: 'Test Client',
        version: '1.0.0',
      },
    });
  });
  
  afterAll(async () => {
    // Shutdown the MCP server
    await mcpServer.shutdown();
  });
  
  // Performance thresholds
  const RESPONSE_TIME_THRESHOLD = 200; // ms
  
  /**
   * Helper function to measure response time
   */
  const measureResponseTime = async (
    method: 'get' | 'post',
    endpoint: string,
    payload?: any
  ): Promise<number> => {
    const startTime = Date.now();
    
    if (method === 'get') {
      await request(app).get(endpoint);
    } else {
      await request(app).post(endpoint).send(payload || {});
    }
    
    return Date.now() - startTime;
  };
  
  describe('Response Time Benchmarks', () => {
    it('should respond to initialization within threshold', async () => {
      const responseTime = await measureResponseTime(
        'post',
        '/mcp/initialize',
        {
          capabilities: {
            sampling: { supported: true },
            notifications: { supported: true },
          },
          clientInfo: {
            name: 'Test Client',
            version: '1.0.0',
          },
        }
      );
      
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
    
    it('should respond to tool listing within threshold', async () => {
      const responseTime = await measureResponseTime(
        'post',
        '/mcp/tools',
        {}
      );
      
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
    
    it('should respond to simple tool execution within threshold', async () => {
      const responseTime = await measureResponseTime(
        'post',
        '/mcp/tools/execute',
        {
          toolName: 'createGraph2D',
          arguments: {
            expression: 'y=x',
            xRange: [-5, 5],
            yRange: [-5, 5],
          },
        }
      );
      
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 2); // Allow more time for tool execution
    });
    
    it('should respond to error cases within threshold', async () => {
      const responseTime = await measureResponseTime(
        'post',
        '/mcp/tools/execute',
        {
          toolName: 'nonExistentTool',
          arguments: {},
        }
      );
      
      expect(responseTime).toBeLessThan(RESPONSE_TIME_THRESHOLD);
    });
  });
  
  describe('Concurrent Request Handling', () => {
    it('should handle multiple concurrent requests efficiently', async () => {
      const concurrentRequests = 10;
      const startTime = Date.now();
      
      // Create an array of promises for concurrent requests
      const requests = Array(concurrentRequests).fill(0).map(() => 
        request(app)
          .post('/mcp/tools/execute')
          .send({
            toolName: 'createGraph2D',
            arguments: {
              expression: 'y=x^2',
              xRange: [-5, 5],
              yRange: [-5, 25],
            },
          })
      );
      
      // Wait for all requests to complete
      const responses = await Promise.all(requests);
      
      const totalTime = Date.now() - startTime;
      const averageTime = totalTime / concurrentRequests;
      
      // All responses should be successful
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
      
      // Average time should be reasonable
      // We allow more time for concurrent requests
      expect(averageTime).toBeLessThan(RESPONSE_TIME_THRESHOLD * 3);
    });
  });
});

