/**
 * MCP Handlers
 * Standardized request/response handlers for MCP operations
 */

// Export all handler components
export * from './types';
export * from './requestHandler';
export * from './responseHandler';
export * from './errorHandler';
export * from './validationHandler';

// Export validation schemas
export * from '../schemas/validationSchemas';

// For backward compatibility, keep the old ValidationSchemas object
import { 
  initializeSchema,
  getResourcesSchema,
  subscribeSchema,
  unsubscribeSchema,
  getToolsSchema,
  executeToolSchema,
  getPromptsSchema,
  executePromptSchema
} from '../schemas/validationSchemas';

/**
 * Common validation schemas for MCP operations
 * @deprecated Use the individual schema exports from '../schemas/validationSchemas' instead
 */
export const ValidationSchemas = {
  initialize: initializeSchema,
  getResources: getResourcesSchema,
  subscribeToResources: subscribeSchema,
  unsubscribeFromResources: unsubscribeSchema,
  getTools: getToolsSchema,
  executeTool: executeToolSchema,
  getPrompts: getPromptsSchema,
  executePrompt: executePromptSchema,
};
