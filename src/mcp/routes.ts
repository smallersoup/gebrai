import { Router, Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';
import { mcpServer } from './server';
import {
  handleRequest,
  createRequestHandler,
  sendSuccess,
  sendError,
  sendNoContent,
  sendSSEMessage,
  sendSSEComment,
  ErrorCode,
  createError
} from './handlers';

// Import validation schemas
import {
  initializeSchema,
  executeToolSchema,
  executePromptSchema,
  subscribeSchema,
  unsubscribeSchema,
  getResourcesSchema,
  getToolsSchema,
  getPromptsSchema
} from './schemas/validationSchemas';

// Create router
export const mcpRouter = Router();

// Define MCP error handler middleware
export const mcpErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('MCP error:', err);
  
  if (err.code && Object.values(ErrorCode).includes(err.code)) {
    // This is a known MCP error
    sendError(res, err);
  } else {
    // This is an unknown error
    sendError(res, createError(
      ErrorCode.INTERNAL_ERROR,
      err.message || 'An unexpected error occurred',
      { stack: err.stack }
    ));
  }
};

/**
 * Health check endpoint
 */
mcpRouter.get('/health', (req, res) => {
  const status = mcpServer.getStatus();
  res.status(200).json(status);
});

/**
 * Initialize the MCP server
 */
mcpRouter.post('/initialize', handleRequest(async (req, res) => {
  const result = await mcpServer.initialize(req.body);
  sendSuccess(res, result);
}, initializeSchema));

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
  getResourcesSchema
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
  subscribeSchema
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
  unsubscribeSchema
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
  getToolsSchema
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
  executeToolSchema
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
  getPromptsSchema
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
  executePromptSchema
));

/**
 * SSE endpoint for resource change notifications
 * 
 * SSE Protocol Format:
 * - Each message consists of one or more lines of text
 * - Each line is terminated by a single newline character (\n)
 * - Messages are separated by two newline characters (\n\n)
 * - Lines starting with a colon (:) are comments and ignored by clients
 * - Field format: field: value\n
 * - Common fields: event, data, id, retry
 */
mcpRouter.get('/events', (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send a comment to keep the connection alive
  const keepAlive = setInterval(() => {
    sendSSEComment(res, 'keepalive');
  }, 30000);
  
  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    logger.info('SSE connection closed');
  });
  
  // Send initial message
  sendSSEMessage(res, { connected: true }, 'connected', uuidv4());
  
  // In a real implementation, we would register this connection to receive notifications
  // and send them as SSE events
});

// Apply the error handler middleware to the router
mcpRouter.use(mcpErrorHandler);
