import Joi from 'joi';
import { Tool } from './types';
import { logger } from '../utils/logger';
import { MCPError, ErrorCode } from './handlers/errorHandler';

/**
 * Validate tool arguments against the tool's input schema
 * @param tool The tool to validate arguments for
 * @param args The arguments to validate
 * @returns Validation result
 */
export function validateToolArguments(
  tool: Tool,
  args: any
): { valid: boolean; error?: string } {
  try {
    // Convert JSON Schema to Joi schema
    // This is a simplified implementation
    // In a real-world scenario, you might want to use a library like json-schema-to-joi
    const joiSchema = convertJsonSchemaToJoi(tool.inputSchema);
    
    // Validate arguments
    const { error } = joiSchema.validate(args, { abortEarly: false });
    
    if (error) {
      return {
        valid: false,
        error: error.message,
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
      error: 'Internal validation error',
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
  // Check for JavaScript code execution attempts
  const unsafePatterns = [
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
  
  return unsafePatterns.some(pattern => pattern.test(expression));
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
    
    // Check for invalid operators sequence
    if (/[+\-*/^]{2,}/.test(expression.replace(/\s/g, ''))) {
      return false; // Multiple operators in sequence
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
 * Convert a JSON Schema to a Joi schema
 * This is a simplified implementation that handles basic types
 * @param jsonSchema JSON Schema object
 * @returns Joi schema
 */
function convertJsonSchemaToJoi(jsonSchema: any): Joi.Schema {
  // Handle null or undefined schema
  if (!jsonSchema) {
    return Joi.any();
  }
  
  // Handle schema with properties (object)
  if (jsonSchema.type === 'object' && jsonSchema.properties) {
    const schemaMap: Record<string, Joi.Schema> = {};
    
    // Convert each property
    Object.entries(jsonSchema.properties).forEach(([key, propSchema]) => {
      schemaMap[key] = convertJsonSchemaToJoi(propSchema);
    });
    
    let schema = Joi.object(schemaMap);
    
    // Handle required properties
    if (jsonSchema.required && Array.isArray(jsonSchema.required)) {
      jsonSchema.required.forEach((requiredProp: string) => {
        if (schemaMap[requiredProp]) {
          schemaMap[requiredProp] = schemaMap[requiredProp].required();
        }
      });
      
      schema = Joi.object(schemaMap);
    }
    
    return schema;
  }
  
  // Handle array schema
  if (jsonSchema.type === 'array' && jsonSchema.items) {
    return Joi.array().items(convertJsonSchemaToJoi(jsonSchema.items));
  }
  
  // Handle primitive types
  switch (jsonSchema.type) {
    case 'string':
      let stringSchema = Joi.string();
      
      if (jsonSchema.minLength !== undefined) {
        stringSchema = stringSchema.min(jsonSchema.minLength);
      }
      
      if (jsonSchema.maxLength !== undefined) {
        stringSchema = stringSchema.max(jsonSchema.maxLength);
      }
      
      if (jsonSchema.pattern) {
        stringSchema = stringSchema.pattern(new RegExp(jsonSchema.pattern));
      }
      
      if (jsonSchema.format === 'email') {
        stringSchema = stringSchema.email();
      }
      
      if (jsonSchema.format === 'uri') {
        stringSchema = stringSchema.uri();
      }
      
      if (jsonSchema.enum) {
        stringSchema = stringSchema.valid(...jsonSchema.enum);
      }
      
      return stringSchema;
      
    case 'number':
    case 'integer':
      let numberSchema = jsonSchema.type === 'integer' ? Joi.number().integer() : Joi.number();
      
      if (jsonSchema.minimum !== undefined) {
        numberSchema = jsonSchema.exclusiveMinimum
          ? numberSchema.greater(jsonSchema.minimum)
          : numberSchema.min(jsonSchema.minimum);
      }
      
      if (jsonSchema.maximum !== undefined) {
        numberSchema = jsonSchema.exclusiveMaximum
          ? numberSchema.less(jsonSchema.maximum)
          : numberSchema.max(jsonSchema.maximum);
      }
      
      if (jsonSchema.enum) {
        numberSchema = numberSchema.valid(...jsonSchema.enum);
      }
      
      return numberSchema;
      
    case 'boolean':
      return Joi.boolean();
      
    case 'null':
      return Joi.valid(null);
      
    default:
      return Joi.any();
  }
}
