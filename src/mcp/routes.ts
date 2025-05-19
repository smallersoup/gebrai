import { Router } from 'express';
import { mcpServer } from './server';
import { logger } from '../utils/logger';
import {
  handleRequest,
  createRequestHandler,
  sendSuccess,
  sendNoContent,
  mcpErrorHandler,
  ValidationSchemas,
  ErrorCode,
  MCPError,
} from './handlers';

// Create router
export const mcpRouter = Router();

/**
 * Initialize the MCP server
 */
mcpRouter.post('/initialize', handleRequest(async (req, res) => {
  const result = await mcpServer.initialize(req.body);
  sendSuccess(res, result);
}, ValidationSchemas.initialize));

/**
 * Shutdown the MCP server
 */
mcpRouter.post('/shutdown', handleRequest(async (req, res) => {
  await mcpServer.shutdown();
  sendNoContent(res);
}));

/**
 * Get resources
 */
mcpRouter.post('/resources', createRequestHandler(
  'getResources',
  async (req, res) => {
    const resources = await mcpServer.getResources(req.body);
    sendSuccess(res, resources);
  },
  ValidationSchemas.getResources
));

/**
 * Subscribe to resources
 */
mcpRouter.post('/resources/subscribe', createRequestHandler(
  'subscribeToResources',
  async (req, res) => {
    const result = await mcpServer.subscribeToResources(req.body);
    sendSuccess(res, result);
  },
  ValidationSchemas.subscribeToResources
));

/**
 * Unsubscribe from resources
 */
mcpRouter.post('/resources/unsubscribe', createRequestHandler(
  'unsubscribeFromResources',
  async (req, res) => {
    await mcpServer.unsubscribeFromResources(req.body);
    sendNoContent(res);
  },
  ValidationSchemas.unsubscribeFromResources
));

/**
 * Get tools
 */
mcpRouter.post('/tools', createRequestHandler(
  'getTools',
  async (req, res) => {
    const tools = await mcpServer.getTools(req.body);
    sendSuccess(res, tools);
  },
  ValidationSchemas.getTools
));

/**
 * Execute a tool
 */
mcpRouter.post('/tools/execute', createRequestHandler(
  'executeTool',
  async (req, res) => {
    // Check for execution timeout
    const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);
    const startTime = Date.now();
    
    const result = await mcpServer.executeTool(req.body);
    
    // If execution takes too long, log a warning
    if (Date.now() - startTime > timeout) {
      logger.warn('Tool execution exceeded timeout', {
        toolName: req.body.toolName,
        executionTime: Date.now() - startTime,
        timeout,
      });
    }
    
    sendSuccess(res, result);
  },
  ValidationSchemas.executeTool
));

/**
 * Get prompts
 */
mcpRouter.post('/prompts', createRequestHandler(
  'getPrompts',
  async (req, res) => {
    const prompts = await mcpServer.getPrompts(req.body);
    sendSuccess(res, prompts);
  },
  ValidationSchemas.getPrompts
));

/**
 * Execute a prompt
 */
mcpRouter.post('/prompts/execute', createRequestHandler(
  'executePrompt',
  async (req, res) => {
    const result = await mcpServer.executePrompt(req.body);
    sendSuccess(res, result);
  },
  ValidationSchemas.executePrompt
));

/**
 * SSE endpoint for resource change notifications
 */
mcpRouter.get('/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send a comment to keep the connection alive
  const keepAlive = setInterval(() => {
    res.write(': keepalive\\n\\n');
  }, 30000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    logger.info('SSE connection closed');
  });
  
  // Send initial message
  res.write('event: connected\\n');
  res.write(`data: ${JSON.stringify({ connected: true })}\\n\\n`);
  
  // In a real implementation, we would register this connection to receive notifications
  // and send them as SSE events
});

/**
 * Error handler for MCP routes
 */
mcpRouter.use(mcpErrorHandler);

