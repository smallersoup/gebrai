import Joi from 'joi';
import { Tool } from './types';
import { logger } from '../utils/logger';
import { MCPError, ErrorCode } from './handlers/errorHandler';

/**
 * Array of regex patterns for potentially unsafe expressions
 * Used for security validation across the application
 */
export const UNSAFE_EXPRESSION_PATTERNS = [
  /eval\s*\(/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,
  /Function\s*\(/i,
  /new\s+Function/i,
  /require\s*\(/i,
  /import\s*\(/i,
  /process/i,
  /global/i,
  /window/i,
  /document/i,
  /console/i,
  /\.__proto__/i,
  /constructor\s*\(/i,
];

/**
 * Validate tool arguments against the tool's input schema
 * @param tool Tool to validate arguments for
 * @param args Arguments to validate
 * @returns Validation result
 */
export function validateToolArguments(
  tool: Tool,
  args: any
): { valid: boolean; error?: string } {
  try {
    // If the tool has no input schema, skip validation
    if (!tool.input) {
      return { valid: true };
    }
    
    // Convert the JSON Schema to a Joi schema
    const schema = convertJsonSchemaToJoi(tool.input);
    
    // Validate the arguments against the schema
    const { error } = schema.validate(args);
    
    if (error) {
      return {
        valid: false,
        error: `Invalid arguments: ${error.message}`,
      };
    }
    
    // Perform additional validation for specific tools
    const additionalValidation = validateToolSpecificArguments(tool.name, args);
    if (!additionalValidation.valid) {
      return additionalValidation;
    }
    
    return { valid: true };
  } catch (error) {
    logger.error('Error validating tool arguments', { tool: tool.name, error });
    return {
      valid: false,
      error: `Error validating arguments: ${error}`,
    };
  }
}

/**
 * Perform tool-specific validation for arguments
 * @param toolName Name of the tool
 * @param args Arguments to validate
 * @returns Validation result
 */
export function validateToolSpecificArguments(
  toolName: string,
  args: any
): { valid: boolean; error?: string } {
  switch (toolName) {
    case 'createGraph2D':
      return validateCreateGraph2DArguments(args);
    case 'solveEquation':
      return validateSolveEquationArguments(args);
    default:
      return { valid: true };
  }
}

/**
 * Validate arguments for the createGraph2D tool
 * @param args Arguments to validate
 * @returns Validation result
 */
export function validateCreateGraph2DArguments(
  args: any
): { valid: boolean; error?: string } {
  try {
    const { expression } = args;
    
    // Check for potentially dangerous expressions
    if (containsUnsafeExpression(expression)) {
      return {
        valid: false,
        error: 'Expression contains potentially unsafe operations',
      };
    }
    
    // Validate mathematical expression format
    if (!isValidMathExpression(expression)) {
      return {
        valid: false,
        error: 'Invalid mathematical expression format',
      };
    }
    
    // Validate ranges if provided
    if (args.xRange) {
      const [xMin, xMax] = args.xRange;
      if (xMin >= xMax) {
        return {
          valid: false,
          error: 'xRange minimum must be less than maximum',
        };
      }
    }
    
    if (args.yRange) {
      const [yMin, yMax] = args.yRange;
      if (yMin >= yMax) {
        return {
          valid: false,
          error: 'yRange minimum must be less than maximum',
        };
      }
    }
    
    return { valid: true };
  } catch (error) {
    logger.error('Error in createGraph2D validation', { error });
    return {
      valid: false,
      error: 'Error validating graph parameters',
    };
  }
}

/**
 * Validate arguments for the solveEquation tool
 * @param args Arguments to validate
 * @returns Validation result
 */
export function validateSolveEquationArguments(
  args: any
): { valid: boolean; error?: string } {
  try {
    const { equation, variable } = args;
    
    // Check for potentially dangerous expressions
    if (containsUnsafeExpression(equation)) {
      return {
        valid: false,
        error: 'Equation contains potentially unsafe operations',
      };
    }
    
    // Validate equation format (must contain equals sign)
    if (!equation.includes('=')) {
      return {
        valid: false,
        error: 'Equation must contain an equals sign (=)',
      };
    }
    
    // Validate that the variable is present in the equation
    if (!equation.includes(variable)) {
      return {
        valid: false,
        error: `Equation does not contain the variable '${variable}'`,
      };
    }
    
    // Validate that the variable is a single character or valid variable name
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(variable)) {
      return {
        valid: false,
        error: 'Variable must be a valid variable name (letters, numbers, underscore, starting with a letter)',
      };
    }
    
    return { valid: true };
  } catch (error) {
    logger.error('Error in solveEquation validation', { error });
    return {
      valid: false,
      error: 'Error validating equation parameters',
    };
  }
}

/**
 * Check if a mathematical expression contains potentially unsafe operations
 * @param expression Expression to check
 * @returns True if the expression contains unsafe operations
 */
export function containsUnsafeExpression(expression: string): boolean {
  return UNSAFE_EXPRESSION_PATTERNS.some(pattern => pattern.test(expression));
}

/**
 * Validate an expression for unsafe patterns and return a Joi validation result
 * For use with Joi custom validators
 * @param value The value to validate
 * @param helpers Joi validation helpers
 * @returns The value if valid, or a Joi error if invalid
 */
export function validateUnsafeExpression(value: string, helpers: any): any {
  if (containsUnsafeExpression(value)) {
    return helpers.error('string.unsafe', { value });
  }
  return value;
}

/**
 * Check if a string is a valid mathematical expression
 * @param expression Expression to check
 * @returns True if the expression is valid
 */
export function isValidMathExpression(expression: string): boolean {
  try {
    // Basic validation for common mathematical expression formats
    // This is a simplified check and can be expanded based on requirements
    
    // Check for balanced parentheses
    let parenthesesCount = 0;
    for (const char of expression) {
      if (char === '(') parenthesesCount++;
      if (char === ')') parenthesesCount--;
      if (parenthesesCount < 0) return false; // Closing parenthesis without opening
    }
    if (parenthesesCount !== 0) return false; // Unbalanced parentheses
    
    // Check for invalid operator sequences
    // This regex accounts for valid cases like negative signs after operators
    if (/(?!^-)[+\-*/^]{2,}(?<![+\-*/^]-)/.test(expression.replace(/\s/g, ''))) {
      return false; // Multiple operators in sequence (excluding valid negative signs)
    }
    
    // Additional check for invalid operator sequences
    // This regex matches sequences of two or more operators that are not followed by a digit or opening parenthesis
    // It catches cases that might be missed by the previous regex
    if (/([+\-*/^]{2,})(?!\d|\()/.test(expression.replace(/\s/g, ''))) {
      return false; // Invalid operator sequence
    }
    
    // Check for valid function calls
    const functionPattern = /([a-zA-Z]+)\s*\(/g;
    let match;
    const validFunctions = [
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
      'log', 'ln', 'exp', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'sign',
      'max', 'min', 'pow', 'mod'
    ];
    
    while ((match = functionPattern.exec(expression)) !== null) {
      const func = match[1].toLowerCase();
      if (!validFunctions.includes(func)) {
        return false; // Unknown function
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Error validating math expression', { expression, error });
    return false;
  }
}

/**
 * Apply numeric bounds (min/max) to a Joi number schema based on JSON Schema
 * @param schema Joi number schema to apply bounds to
 * @param jsonSchema JSON Schema containing minimum and maximum properties
 * @returns Joi schema with bounds applied
 */
function applyNumericBounds(schema: Joi.NumberSchema, jsonSchema: JSONSchema): Joi.NumberSchema {
  return schema
    .min(jsonSchema.minimum !== undefined ? jsonSchema.minimum : undefined)
    .max(jsonSchema.maximum !== undefined ? jsonSchema.maximum : undefined);
}

/**
 * Convert a JSON Schema to a Joi schema
 * This is a simplified implementation that handles basic types
 * @param jsonSchema JSON Schema to convert
 * @returns Joi schema
 */
function convertJsonSchemaToJoi(jsonSchema: any): Joi.Schema {
  // If the schema is an object with properties, create a Joi object schema
  if (jsonSchema.type === 'object' && jsonSchema.properties) {
    const schemaMap: Record<string, Joi.Schema> = {};
    
    // Convert each property to a Joi schema
    for (const [key, prop] of Object.entries<any>(jsonSchema.properties)) {
      schemaMap[key] = convertJsonSchemaToJoi(prop);
    }
    
    let schema = Joi.object(schemaMap);
    
    // Add required validation if specified
    if (jsonSchema.required && Array.isArray(jsonSchema.required)) {
      schema = schema.fork(jsonSchema.required, (schema) => schema.required());
    }
    
    return schema;
  }
  
  // Handle different types
  switch (jsonSchema.type) {
    case 'string':
      let stringSchema = Joi.string();
      
      // Add pattern validation if specified
      if (jsonSchema.pattern) {
        stringSchema = stringSchema.pattern(new RegExp(jsonSchema.pattern));
      }
      
      // Add format validation if specified
      if (jsonSchema.format) {
        switch (jsonSchema.format) {
          case 'email':
            stringSchema = stringSchema.email();
            break;
          case 'uri':
            stringSchema = stringSchema.uri();
            break;
          // Add more format validations as needed
        }
      }
      
      return stringSchema;
      
    case 'number':
      return applyNumericBounds(Joi.number(), jsonSchema);
      
    case 'integer':
      return applyNumericBounds(Joi.number().integer(), jsonSchema);
      
    case 'boolean':
      return Joi.boolean();
      
    case 'array':
      let arraySchema = Joi.array();
      
      // Add items validation if specified
      if (jsonSchema.items) {
        arraySchema = arraySchema.items(convertJsonSchemaToJoi(jsonSchema.items));
      }
      
      // Add minItems validation if specified
      if (jsonSchema.minItems !== undefined) {
        arraySchema = arraySchema.min(jsonSchema.minItems);
      }
      
      // Add maxItems validation if specified
      if (jsonSchema.maxItems !== undefined) {
        arraySchema = arraySchema.max(jsonSchema.maxItems);
      }
      
      return arraySchema;
      
    default:
      return Joi.any();
  }
}
