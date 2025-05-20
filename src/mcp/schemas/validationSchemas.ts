import Joi from 'joi';
import { ValidationSchema } from '../handlers/types';
import { validateUnsafeExpression } from '../validation';

/**
 * Validation schema for MCP initialization request
 */
export const initializeSchema: ValidationSchema = {
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
};

/**
 * Validation schema for tool execution request
 */
export const executeToolSchema: ValidationSchema = {
  body: {
    toolName: Joi.string().required(),
    arguments: Joi.object().required(),
    executionId: Joi.string().uuid(),
    metadata: Joi.object({
      userInitiated: Joi.boolean(),
    }),
  },
};

/**
 * Validation schema for prompt execution request
 */
export const executePromptSchema: ValidationSchema = {
  body: {
    promptId: Joi.string().required(),
    arguments: Joi.object().required(),
    executionId: Joi.string().uuid(),
  },
};

/**
 * Validation schema for resource subscription request
 */
export const subscribeSchema: ValidationSchema = {
  body: {
    resourceTypes: Joi.array().items(Joi.string()).required(),
    filter: Joi.object(),
    subscriptionId: Joi.string().uuid(),
  },
};

/**
 * Validation schema for resource unsubscription request
 */
export const unsubscribeSchema: ValidationSchema = {
  body: {
    subscriptionId: Joi.string().uuid().required(),
  },
};

/**
 * Validation schema for getting resources request
 */
export const getResourcesSchema: ValidationSchema = {
  body: {
    resourceTypes: Joi.array().items(Joi.string()),
    filter: Joi.object(),
  },
};

/**
 * Validation schema for getting tools request
 */
export const getToolsSchema: ValidationSchema = {
  body: {
    filter: Joi.object(),
  },
};

/**
 * Validation schema for getting prompts request
 */
export const getPromptsSchema: ValidationSchema = {
  body: {
    filter: Joi.object(),
  },
};

/**
 * Validation schema for createGraph2D tool arguments
 */
export const createGraph2DArgumentsSchema = Joi.object({
  expression: Joi.string().required()
    .custom((value, helpers) => validateUnsafeExpression(value, helpers)),
  xRange: Joi.array().items(Joi.number()).min(2).max(2)
    .custom((value, helpers) => {
      const [min, max] = value;
      if (min >= max) {
        return helpers.error('array.range', { value });
      }
      return value;
    }),
  yRange: Joi.array().items(Joi.number()).min(2).max(2)
    .custom((value, helpers) => {
      const [min, max] = value;
      if (min >= max) {
        return helpers.error('array.range', { value });
      }
      return value;
    }),
  title: Joi.string(),
  showGrid: Joi.boolean(),
  showAxes: Joi.boolean(),
  color: Joi.string().pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^[a-zA-Z]+$/),
});

/**
 * Validation schema for solveEquation tool arguments
 */
export const solveEquationArgumentsSchema = Joi.object({
  equation: Joi.string().required()
    .custom((value, helpers) => validateUnsafeExpression(value, helpers))
    .custom((value, helpers) => {
      // Validate equation format (must contain equals sign)
      if (!value.includes('=')) {
        return helpers.error('string.equation', { value });
      }
      
      return value;
    }),
  variable: Joi.string().required()
    .pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)
    .custom((value, helpers) => {
      const equation = helpers.state.ancestors[0].equation;
      
      // Validate that the variable is present in the equation
      if (!equation.includes(value)) {
        return helpers.error('string.variable', { value });
      }
      
      return value;
    }),
  visualize: Joi.boolean(),
});

// Add custom error messages for Joi
Joi.defaults((schema) => {
  return schema.messages({
    'string.unsafe': '{{#label}} contains potentially unsafe operations',
    'array.range': '{{#label}} minimum must be less than maximum',
    'string.equation': '{{#label}} must contain an equals sign (=)',
    'string.variable': '{{#label}} must be present in the equation',
  });
});
