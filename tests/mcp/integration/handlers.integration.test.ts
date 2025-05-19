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

describe('MCP Handlers Integration Tests', () => {
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
  
  describe('Server Operations', () => {
    it('should initialize the server', async () => {
      const response = await request(app)
        .post('/mcp/initialize')
        .send({
          capabilities: {
            sampling: { supported: true },
            notifications: { supported: true },
          },
          clientInfo: {
            name: 'Test Client',
            version: '1.0.0',
          },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.capabilities).toBeDefined();
      expect(response.body.data.serverInfo).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
    });
  });
  
  describe('Tool Operations', () => {
    it('should get available tools', async () => {
      const response = await request(app)
        .post('/mcp/tools')
        .send({});
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.requestId).toBeDefined();
    });
    
    it('should execute a tool successfully', async () => {
      const response = await request(app)
        .post('/mcp/tools/execute')
        .send({
          toolName: 'createGraph2D',
          arguments: {
            expression: 'y=x^2',
            xRange: [-5, 5],
            yRange: [-5, 25],
            title: 'Parabola',
          },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.result).toBeDefined();
      expect(response.body.data.result.visualizationId).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
    });
    
    it('should return a validation error for invalid tool arguments', async () => {
      const response = await request(app)
        .post('/mcp/tools/execute')
        .send({
          toolName: 'createGraph2D',
          arguments: {
            // Missing required 'expression' field
            xRange: [-5, 5],
          },
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('INVALID_TOOL_ARGUMENTS');
      expect(response.body.meta.requestId).toBeDefined();
    });
    
    it('should return a not found error for non-existent tool', async () => {
      const response = await request(app)
        .post('/mcp/tools/execute')
        .send({
          toolName: 'nonExistentTool',
          arguments: {},
        });
      
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('TOOL_NOT_FOUND');
      expect(response.body.meta.requestId).toBeDefined();
    });
    
    it('should handle math parsing errors', async () => {
      const response = await request(app)
        .post('/mcp/tools/execute')
        .send({
          toolName: 'createGraph2D',
          arguments: {
            expression: 'y=x(',  // Invalid expression
            xRange: [-5, 5],
            yRange: [-5, 25],
          },
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('MATH_PARSING_ERROR');
      expect(response.body.meta.requestId).toBeDefined();
    });
  });
  
  describe('Equation Solving', () => {
    it('should solve an equation successfully', async () => {
      const response = await request(app)
        .post('/mcp/tools/execute')
        .send({
          toolName: 'solveEquation',
          arguments: {
            equation: 'x^2+2x-3=0',
            variable: 'x',
          },
        });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.result).toBeDefined();
      expect(Array.isArray(response.body.data.result.solutions)).toBe(true);
      expect(response.body.data.result.solutions.length).toBeGreaterThan(0);
      expect(Array.isArray(response.body.data.result.steps)).toBe(true);
      expect(response.body.meta.requestId).toBeDefined();
    });
    
    it('should validate equation format', async () => {
      const response = await request(app)
        .post('/mcp/tools/execute')
        .send({
          toolName: 'solveEquation',
          arguments: {
            equation: 'x^2+2x-3',  // Missing equals sign
            variable: 'x',
          },
        });
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('MATH_PARSING_ERROR');
      expect(response.body.error.message).toContain('equals sign');
      expect(response.body.meta.requestId).toBeDefined();
    });
  });
});

