import { toolRegistry } from './registry';
import { createGraph2DTool } from './createGraph2D';
import { solveEquationTool } from './solveEquation';
import { logger } from '../../utils/logger';

/**
 * Register all tools with the registry
 */
export function registerTools(): void {
  logger.info('Registering MCP tools');
  
  // Register tools
  toolRegistry.registerTool(createGraph2DTool);
  toolRegistry.registerTool(solveEquationTool);
  
  // Add more tools here as they are implemented
  
  logger.info(`Registered ${toolRegistry.getAllTools().length} tools`);
}

