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

// Export common validation schemas
import { ValidationSchema } from './types';
import Joi from 'joi';

/**
 * Common validation schemas for MCP operations
 */
export const ValidationSchemas = {
  // Initialize operation
  initialize: {
    body: {
      capabilities: Joi.object({
        sampling: Joi.object({
          supported: Joi.boolean().required(),
        }),
        notifications: Joi.object({
          supported: Joi.boolean().required(),
        }),
      }).required(),
      clientInfo: Joi.object({
        name: Joi.string().required(),
        version: Joi.string(),
      }),
      locale: Joi.string(),
      rootUri: Joi.string().uri(),
    },
  } as ValidationSchema,
  
  // Get resources operation
  getResources: {
    body: {
      resourceTypes: Joi.array().items(Joi.string()),
      filter: Joi.object(),
    },
  } as ValidationSchema,
  
  // Subscribe to resources operation
  subscribeToResources: {
    body: {
      resourceTypes: Joi.array().items(Joi.string()).required(),
      filter: Joi.object(),
      subscriptionId: Joi.string().uuid(),
    },
  } as ValidationSchema,
  
  // Unsubscribe from resources operation
  unsubscribeFromResources: {
    body: {
      subscriptionId: Joi.string().uuid().required(),
    },
  } as ValidationSchema,
  
  // Get tools operation
  getTools: {
    body: {
      filter: Joi.object(),
    },
  } as ValidationSchema,
  
  // Execute tool operation
  executeTool: {
    body: {
      toolName: Joi.string().required(),
      arguments: Joi.object().required(),
      executionId: Joi.string().uuid(),
      metadata: Joi.object({
        userInitiated: Joi.boolean(),
      }).unknown(true),
    },
  } as ValidationSchema,
  
  // Get prompts operation
  getPrompts: {
    body: {
      filter: Joi.object(),
    },
  } as ValidationSchema,
  
  // Execute prompt operation
  executePrompt: {
    body: {
      promptId: Joi.string().required(),
      arguments: Joi.object().required(),
      executionId: Joi.string().uuid(),
    },
  } as ValidationSchema,
};

