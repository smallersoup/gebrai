import { mcpServer } from './server';
import { registerTools } from './tools';
import { registerPrompts } from './prompts';
import { logger } from '../utils/logger';

/**
 * Initialize the MCP module
 */
export async function initializeMCP(): Promise<void> {
  logger.info('Initializing MCP module');
  
  // Register tools
  registerTools();
  
  // Register prompts
  registerPrompts();
  
  logger.info('MCP module initialized');
}

// Export MCP components
export { mcpServer } from './server';
export { mcpRouter } from './routes';
export * from './types';

