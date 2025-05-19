import { Router, Request, Response, NextFunction } from 'express';
import { mcpServer } from './server';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';

// Create router
export const mcpRouter = Router();

/**
 * Wrap async route handlers to catch errors
 * @param fn Async route handler function
 * @returns Express route handler
 */
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Initialize the MCP server
 */
mcpRouter.post('/initialize', asyncHandler(async (req, res) => {
  const result = await mcpServer.initialize(req.body);
  res.json(result);
}));

/**
 * Shutdown the MCP server
 */
mcpRouter.post('/shutdown', asyncHandler(async (req, res) => {
  await mcpServer.shutdown();
  res.json({ success: true });
}));

/**
 * Get resources
 */
mcpRouter.post('/resources', asyncHandler(async (req, res) => {
  const resources = await mcpServer.getResources(req.body);
  res.json(resources);
}));

/**
 * Subscribe to resources
 */
mcpRouter.post('/resources/subscribe', asyncHandler(async (req, res) => {
  const result = await mcpServer.subscribeToResources(req.body);
  res.json(result);
}));

/**
 * Unsubscribe from resources
 */
mcpRouter.post('/resources/unsubscribe', asyncHandler(async (req, res) => {
  await mcpServer.unsubscribeFromResources(req.body);
  res.json({ success: true });
}));

/**
 * Get tools
 */
mcpRouter.post('/tools', asyncHandler(async (req, res) => {
  const tools = await mcpServer.getTools(req.body);
  res.json(tools);
}));

/**
 * Execute a tool
 */
mcpRouter.post('/tools/execute', asyncHandler(async (req, res) => {
  const result = await mcpServer.executeTool(req.body);
  
  // Check for execution timeout
  const timeout = parseInt(process.env.REQUEST_TIMEOUT || '1000', 10);
  const startTime = Date.now();
  
  // If execution takes too long, log a warning
  if (Date.now() - startTime > timeout) {
    logger.warn('Tool execution exceeded timeout', {
      toolName: req.body.toolName,
      executionTime: Date.now() - startTime,
      timeout,
    });
  }
  
  res.json(result);
}));

/**
 * Get prompts
 */
mcpRouter.post('/prompts', asyncHandler(async (req, res) => {
  const prompts = await mcpServer.getPrompts(req.body);
  res.json(prompts);
}));

/**
 * Execute a prompt
 */
mcpRouter.post('/prompts/execute', asyncHandler(async (req, res) => {
  const result = await mcpServer.executePrompt(req.body);
  res.json(result);
}));

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
    res.write(': keepalive\n\n');
  }, 30000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    logger.info('SSE connection closed');
  });
  
  // Send initial message
  res.write('event: connected\n');
  res.write(`data: ${JSON.stringify({ connected: true })}\n\n`);
  
  // In a real implementation, we would register this connection to receive notifications
  // and send them as SSE events
});

/**
 * Error handler for MCP routes
 */
mcpRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('MCP route error', { error: err.message, stack: err.stack });
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: {
        code: 'MCP_ERROR',
        message: err.message,
      },
    });
  }
  
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    },
  });
});

