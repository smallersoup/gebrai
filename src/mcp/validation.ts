import Joi from 'joi';
import { Tool } from './types';
import { logger } from '../utils/logger';

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

