import { createGraph2DTool } from '../../../src/mcp/tools/createGraph2D';
import * as math from 'mathjs';

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock mathjs
jest.mock('mathjs', () => ({
  compile: jest.fn().mockImplementation((expr) => ({
    evaluate: jest.fn().mockImplementation(({ x }) => {
      // Simple mock implementation for testing
      if (expr === 'x**2') {
        return x * x;
      }
      return 0;
    }),
  })),
}));

describe('createGraph2D Tool', () => {
  it('should have the correct name and description', () => {
    expect(createGraph2DTool.name).toBe('createGraph2D');
    expect(createGraph2DTool.description).toBeDefined();
  });

  it('should have valid input and output schemas', () => {
    expect(createGraph2DTool.inputSchema).toBeDefined();
    expect(createGraph2DTool.outputSchema).toBeDefined();
    
    // Check required properties in input schema
    expect(createGraph2DTool.inputSchema.required).toContain('expression');
    
    // Check properties in input schema
    expect(createGraph2DTool.inputSchema.properties).toHaveProperty('expression');
    expect(createGraph2DTool.inputSchema.properties).toHaveProperty('xRange');
    expect(createGraph2DTool.inputSchema.properties).toHaveProperty('yRange');
    
    // Check properties in output schema
    expect(createGraph2DTool.outputSchema.properties).toHaveProperty('visualizationId');
    expect(createGraph2DTool.outputSchema.properties).toHaveProperty('renderData');
    expect(createGraph2DTool.outputSchema.properties).toHaveProperty('interactiveUrl');
  });

  describe('execute', () => {
    it('should execute successfully with minimal arguments', async () => {
      const args = {
        expression: 'y=x^2',
      };

      const result = await createGraph2DTool.execute(args);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.visualizationId).toBeDefined();
      expect(result.result.renderData).toBeDefined();
      expect(result.result.renderData.format).toBe('svg');
      expect(result.result.interactiveUrl).toBeDefined();
      expect(result.resources).toBeDefined();
      expect(result.resources?.length).toBe(1);
      expect(result.resources?.[0].type).toBe('visualization/2d-graph');
    });

    it('should execute successfully with all arguments', async () => {
      const args = {
        expression: 'y=x^2',
        xRange: [-5, 5],
        yRange: [-2, 10],
        title: 'Test Graph',
        showGrid: true,
        showAxes: true,
        color: '#00FF00',
      };

      const result = await createGraph2DTool.execute(args);

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.visualizationId).toBeDefined();
      expect(result.result.renderData).toBeDefined();
      expect(result.result.renderData.format).toBe('svg');
      expect(result.result.interactiveUrl).toBeDefined();
      expect(result.resources).toBeDefined();
      expect(result.resources?.length).toBe(1);
      expect(result.resources?.[0].type).toBe('visualization/2d-graph');
      expect(result.resources?.[0].data.expression).toBe('y=x^2');
      expect(result.resources?.[0].data.xRange).toEqual([-5, 5]);
      expect(result.resources?.[0].data.yRange).toEqual([-2, 10]);
      expect(result.resources?.[0].data.color).toBe('#00FF00');
      expect(result.resources?.[0].metadata?.title).toBe('Test Graph');
    });

    it('should handle errors gracefully when expression is invalid', async () => {
      // Mock math.compile to throw an error
      (math.compile as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Invalid expression');
      });

      const args = {
        expression: 'y=invalid_expression',
      };

      const result = await createGraph2DTool.execute(args);

      expect(result).toBeDefined();
      expect(result.result).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('TOOL_EXECUTION_ERROR');
      expect(result.error?.message).toContain('Invalid mathematical expression');
    });
  });
});
