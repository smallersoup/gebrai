import Joi from 'joi';
import {
  initializeSchema,
  executeToolSchema,
  executePromptSchema,
  subscribeSchema,
  unsubscribeSchema,
  getResourcesSchema,
  getToolsSchema,
  getPromptsSchema,
  createGraph2DArgumentsSchema,
  solveEquationArgumentsSchema
} from '../../../src/mcp/schemas/validationSchemas';

describe('Validation Schemas', () => {
  describe('initializeSchema', () => {
    it('should validate valid initialization request', () => {
      const validRequest = {
        capabilities: {
          sampling: {
            supported: true,
          },
          notifications: {
            supported: true,
          },
        },
        clientInfo: {
          name: 'TestClient',
          version: '1.0.0',
        },
        locale: 'en-US',
        rootUri: 'https://example.com',
      };

      const { error } = Joi.object(initializeSchema.body).validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should invalidate request with missing required fields', () => {
      const invalidRequest = {
        capabilities: {
          sampling: {
            // Missing 'supported' field
          },
          notifications: {
            supported: true,
          },
        },
      };

      const { error } = Joi.object(initializeSchema.body).validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('executeToolSchema', () => {
    it('should validate valid tool execution request', () => {
      const validRequest = {
        toolName: 'createGraph2D',
        arguments: {
          expression: 'y=x^2',
        },
        executionId: '123e4567-e89b-12d3-a456-426614174000',
        metadata: {
          userInitiated: true,
        },
      };

      const { error } = Joi.object(executeToolSchema.body).validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should invalidate request with missing required fields', () => {
      const invalidRequest = {
        // Missing toolName
        arguments: {
          expression: 'y=x^2',
        },
      };

      const { error } = Joi.object(executeToolSchema.body).validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('executePromptSchema', () => {
    it('should validate valid prompt execution request', () => {
      const validRequest = {
        promptId: 'mathVisualization',
        arguments: {
          expression: 'y=x^2',
        },
        executionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const { error } = Joi.object(executePromptSchema.body).validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should invalidate request with missing required fields', () => {
      const invalidRequest = {
        promptId: 'mathVisualization',
        // Missing arguments
      };

      const { error } = Joi.object(executePromptSchema.body).validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('subscribeSchema', () => {
    it('should validate valid subscription request', () => {
      const validRequest = {
        resourceTypes: ['visualization'],
        filter: { type: '2d-graph' },
        subscriptionId: '123e4567-e89b-12d3-a456-426614174000',
      };

      const { error } = Joi.object(subscribeSchema.body).validate(validRequest);
      expect(error).toBeUndefined();
    });

    it('should invalidate request with missing required fields', () => {
      const invalidRequest = {
        // Missing resourceTypes
        filter: { type: '2d-graph' },
      };

      const { error } = Joi.object(subscribeSchema.body).validate(invalidRequest);
      expect(error).toBeDefined();
    });
  });

  describe('createGraph2DArgumentsSchema', () => {
    it('should validate valid arguments', () => {
      const validArgs = {
        expression: 'y=x^2',
        xRange: [-10, 10],
        yRange: [-10, 10],
        title: 'Parabola',
        showGrid: true,
        showAxes: true,
        color: '#FF0000',
      };

      const { error } = createGraph2DArgumentsSchema.validate(validArgs);
      expect(error).toBeUndefined();
    });

    it('should validate with only required arguments', () => {
      const validArgs = {
        expression: 'y=x^2',
      };

      const { error } = createGraph2DArgumentsSchema.validate(validArgs);
      expect(error).toBeUndefined();
    });

    it('should invalidate unsafe expressions', () => {
      const invalidArgs = {
        expression: 'y=x^2; eval("alert(1)")',
      };

      const { error } = createGraph2DArgumentsSchema.validate(invalidArgs);
      expect(error).toBeDefined();
      expect(error.message).toContain('unsafe');
    });

    it('should invalidate invalid ranges', () => {
      const invalidArgs = {
        expression: 'y=x^2',
        xRange: [10, 5], // Min > Max
      };

      const { error } = createGraph2DArgumentsSchema.validate(invalidArgs);
      expect(error).toBeDefined();
      expect(error.message).toContain('minimum must be less than maximum');
    });

    it('should invalidate invalid color format', () => {
      const invalidArgs = {
        expression: 'y=x^2',
        color: 'not-a-color',
      };

      const { error } = createGraph2DArgumentsSchema.validate(invalidArgs);
      expect(error).toBeDefined();
    });
  });

  describe('solveEquationArgumentsSchema', () => {
    it('should validate valid arguments', () => {
      const validArgs = {
        equation: 'x^2+2x-3=0',
        variable: 'x',
        visualize: true,
      };

      const { error } = solveEquationArgumentsSchema.validate(validArgs);
      expect(error).toBeUndefined();
    });

    it('should invalidate unsafe equations', () => {
      const invalidArgs = {
        equation: 'x^2+2x-3=0; eval("alert(1)")',
        variable: 'x',
      };

      const { error } = solveEquationArgumentsSchema.validate(invalidArgs);
      expect(error).toBeDefined();
      expect(error.message).toContain('unsafe');
    });

    it('should invalidate equations without equals sign', () => {
      const invalidArgs = {
        equation: 'x^2+2x-3',
        variable: 'x',
      };

      const { error } = solveEquationArgumentsSchema.validate(invalidArgs);
      expect(error).toBeDefined();
      expect(error.message).toContain('equals sign');
    });

    it('should invalidate when variable is not in equation', () => {
      const invalidArgs = {
        equation: 'y^2+2y-3=0',
        variable: 'x',
      };

      const { error } = solveEquationArgumentsSchema.validate(invalidArgs);
      expect(error).toBeDefined();
      expect(error.message).toContain('must be present in the equation');
    });

    it('should invalidate invalid variable names', () => {
      const invalidArgs = {
        equation: 'x^2+2x-3=0',
        variable: '123x', // Starts with a number
      };

      const { error } = solveEquationArgumentsSchema.validate(invalidArgs);
      expect(error).toBeDefined();
    });
  });
});

