import { Request } from 'express';
import Joi from 'joi';
import { logger } from '../../utils/logger';
import { ValidationSchema } from './types';
import { MCPError, ErrorCode } from './errorHandler';

/**
 * Validate a request against a schema
 * @param req Express request object
 * @param schema Validation schema
 * @returns Validation result
 */
export function validateRequest(
  req: Request,
  schema: ValidationSchema
): { valid: boolean; error?: MCPError } {
  try {
    // Validate request body if schema is provided
    if (schema.body) {
      const { error } = Joi.object(schema.body).validate(req.body, {
        abortEarly: false,
        allowUnknown: true,
      });
      
      if (error) {
        return {
          valid: false,
          error: new MCPError(
            ErrorCode.VALIDATION_ERROR,
            `Invalid request body: ${error.message}`,
            { details: error.details }
          ),
        };
      }
    }
    
    // Validate query parameters if schema is provided
    if (schema.query) {
      const { error } = Joi.object(schema.query).validate(req.query, {
        abortEarly: false,
        allowUnknown: true,
      });
      
      if (error) {
        return {
          valid: false,
          error: new MCPError(
            ErrorCode.VALIDATION_ERROR,
            `Invalid query parameters: ${error.message}`,
            { details: error.details }
          ),
        };
      }
    }
    
    // Validate URL parameters if schema is provided
    if (schema.params) {
      const { error } = Joi.object(schema.params).validate(req.params, {
        abortEarly: false,
        allowUnknown: true,
      });
      
      if (error) {
        return {
          valid: false,
          error: new MCPError(
            ErrorCode.VALIDATION_ERROR,
            `Invalid URL parameters: ${error.message}`,
            { details: error.details }
          ),
        };
      }
    }
    
    return { valid: true };
  } catch (error) {
    logger.error('Error validating request', { error });
    
    return {
      valid: false,
      error: new MCPError(
        ErrorCode.INTERNAL_ERROR,
        'Internal validation error',
        { originalError: error }
      ),
    };
  }
}

/**
 * Create a validation schema for a request
 * @param bodySchema Schema for request body
 * @param querySchema Schema for query parameters
 * @param paramsSchema Schema for URL parameters
 * @returns Validation schema
 */
export function createValidationSchema(
  bodySchema?: Record<string, any>,
  querySchema?: Record<string, any>,
  paramsSchema?: Record<string, any>
): ValidationSchema {
  const schema: ValidationSchema = {};
  
  if (bodySchema) {
    schema.body = bodySchema;
  }
  
  if (querySchema) {
    schema.query = querySchema;
  }
  
  if (paramsSchema) {
    schema.params = paramsSchema;
  }
  
  return schema;
}

/**
 * Create a validation schema for tool execution
 * @param requiredFields Array of required field names
 * @returns Validation schema for tool execution
 */
export function createToolExecutionSchema(requiredFields: string[] = []): ValidationSchema {
  return {
    body: {
      toolName: Joi.string().required(),
      arguments: Joi.object().required(),
      executionId: Joi.string().uuid(),
      metadata: Joi.object(),
    },
  };
}

/**
 * Create a validation schema for prompt execution
 * @returns Validation schema for prompt execution
 */
export function createPromptExecutionSchema(): ValidationSchema {
  return {
    body: {
      promptId: Joi.string().required(),
      arguments: Joi.object().required(),
      executionId: Joi.string().uuid(),
    },
  };
}

