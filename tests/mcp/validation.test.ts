import { validateToolArguments } from '../../src/mcp/validation';
import { Tool } from '../../src/mcp/types';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Validation', () => {
  describe('validateToolArguments', () => {
    // Create a mock tool for testing
    const mockTool: Tool = {
      name: 'mockTool',
      description: 'A mock tool for testing',
      inputSchema: {
        type: 'object',
        required: ['requiredParam'],
        properties: {
          requiredParam: {
            type: 'string',
          },
          stringParam: {
            type: 'string',
            minLength: 3,
            maxLength: 10,
          },
          numberParam: {
            type: 'number',
            minimum: 0,
            maximum: 100,
          },
          integerParam: {
            type: 'integer',
            minimum: 1,
            maximum: 10,
          },
          booleanParam: {
            type: 'boolean',
          },
          arrayParam: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          objectParam: {
            type: 'object',
            properties: {
              nestedParam: {
                type: 'string',
              },
            },
          },
        },
      },
      outputSchema: {},
      execute: jest.fn(),
    };

    it('should validate valid arguments', () => {
      const args = {
        requiredParam: 'value',
        stringParam: 'test',
        numberParam: 50,
        integerParam: 5,
        booleanParam: true,
        arrayParam: ['one', 'two'],
        objectParam: {
          nestedParam: 'nested',
        },
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate with only required arguments', () => {
      const args = {
        requiredParam: 'value',
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should invalidate missing required arguments', () => {
      const args = {
        stringParam: 'test',
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should invalidate wrong type arguments', () => {
      const args = {
        requiredParam: 'value',
        stringParam: 123, // Should be a string
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should invalidate string arguments that are too short', () => {
      const args = {
        requiredParam: 'value',
        stringParam: 'ab', // Too short (min 3)
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should invalidate string arguments that are too long', () => {
      const args = {
        requiredParam: 'value',
        stringParam: 'this is too long', // Too long (max 10)
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should invalidate number arguments that are too small', () => {
      const args = {
        requiredParam: 'value',
        numberParam: -1, // Too small (min 0)
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should invalidate number arguments that are too large', () => {
      const args = {
        requiredParam: 'value',
        numberParam: 101, // Too large (max 100)
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should invalidate integer arguments that are not integers', () => {
      const args = {
        requiredParam: 'value',
        integerParam: 5.5, // Not an integer
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should invalidate array arguments with wrong item types', () => {
      const args = {
        requiredParam: 'value',
        arrayParam: ['one', 2], // Second item should be a string
      };

      const result = validateToolArguments(mockTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle null or undefined schema gracefully', () => {
      const toolWithNullSchema: Tool = {
        ...mockTool,
        inputSchema: null as any,
      };

      const args = {
        requiredParam: 'value',
      };

      const result = validateToolArguments(toolWithNullSchema, args);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle validation errors gracefully', () => {
      // Create a tool with an invalid schema that will cause an error
      const invalidTool: Tool = {
        ...mockTool,
        inputSchema: {
          type: 'invalid-type', // This will cause an error
        } as any,
      };

      const args = {
        requiredParam: 'value',
      };

      const result = validateToolArguments(invalidTool, args);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});

