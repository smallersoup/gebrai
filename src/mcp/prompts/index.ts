import { promptRegistry } from './registry';
import { mathVisualizationPrompt } from './mathVisualization';
import { logger } from '../../utils/logger';

/**
 * Register all prompts with the registry
 */
export function registerPrompts(): void {
  logger.info('Registering MCP prompts');
  
  // Register prompts
  promptRegistry.registerPrompt(mathVisualizationPrompt);
  
  // Add more prompts here as they are implemented
  
  logger.info(`Registered ${promptRegistry.getAllPrompts().length} prompts`);
}

