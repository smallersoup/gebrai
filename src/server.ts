import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { logger } from './utils/logger';
import { mcpRouter } from './mcp/routes';
import { initializeMCP } from './mcp';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { mcpServer } from './mcp/server';

// Create Express application
const app = express();

// Apply middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(requestLogger);

// Apply routes
app.use('/mcp', mcpRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Apply error handler
app.use(errorHandler);

/**
 * Start the server on the specified port
 * @param port The port to listen on
 * @returns A promise that resolves when the server is started
 */
export const startServer = async (port: number): Promise<void> => {
  // Initialize MCP module
  await initializeMCP();
  
  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      logger.info(`Server listening on port ${port}`);
      resolve();
    });

    // Track connections
    server.on('connection', (socket) => {
      mcpServer.registerConnection();
      
      socket.on('close', () => {
        mcpServer.unregisterConnection();
      });
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });
  });
};
