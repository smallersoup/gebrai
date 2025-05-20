import {
  validateToolSpecificArguments,
  validateCreateGraph2DArguments,
  validateSolveEquationArguments,
  containsUnsafeExpression,
  isValidMathExpression
} from '../../../src/mcp/validation';

// Mock the logger
jest.mock('../../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Math Validation', () => {
  describe('validateToolSpecificArguments', () => {
    it('should validate createGraph2D arguments', () => {
      const args = {
        expression: 'y=x^2',
        xRange: [-10, 10],
        yRange: [-10, 10],
      };

      const result = validateToolSpecificArguments('createGraph2D', args);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate solveEquation arguments', () => {
      const args = {
        equation: 'x^2+2x-3=0',
        variable: 'x',
      };

      const result = validateToolSpecificArguments('solveEquation', args);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for unknown tool', () => {
      const args = {
        someArg: 'value',
      };

      const result = validateToolSpecificArguments('unknownTool', args);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe('validateCreateGraph2DArguments', () => {
    it('should validate valid arguments', () => {
      const args = {
        expression: 'y=x^2',
        xRange: [-10, 10],
        yRange: [-10, 10],
      };

      const result = validateCreateGraph2DArguments(args);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should invalidate unsafe expressions', () => {
      const args = {
        expression: 'y=x^2; eval("alert(1)")',
        xRange: [-10, 10],
        yRange: [-10, 10],
      };

      const result = validateCreateGraph2DArguments(args);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unsafe');
    });

    it('should invalidate invalid math expressions', () => {
      const args = {
        expression: 'y=x^2))', // Unbalanced parentheses
        xRange: [-10, 10],
        yRange: [-10, 10],
      };

      const result = validateCreateGraph2DArguments(args);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid mathematical expression');
    });

    it('should invalidate invalid xRange', () => {
      const args = {
        expression: 'y=x^2',
        xRange: [10, -10], // Min > Max
        yRange: [-10, 10],
      };

      const result = validateCreateGraph2DArguments(args);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('xRange');
    });

    it('should invalidate invalid yRange', () => {
      const args = {
        expression: 'y=x^2',
        xRange: [-10, 10],
        yRange: [10, 10], // Min >= Max
      };

      const result = validateCreateGraph2DArguments(args);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('yRange');
    });
  });

  describe('validateSolveEquationArguments', () => {
    it('should validate valid arguments', () => {
      const args = {
        equation: 'x^2+2x-3=0',
        variable: 'x',
      };

      const result = validateSolveEquationArguments(args);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should invalidate unsafe expressions', () => {
      const args = {
        equation: 'x^2+2x-3=0; eval("alert(1)")',
        variable: 'x',
      };

      const result = validateSolveEquationArguments(args);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('unsafe');
    });

    it('should invalidate equations without equals sign', () => {
      const args = {
        equation: 'x^2+2x-3',
        variable: 'x',
      };

      const result = validateSolveEquationArguments(args);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('equals sign');
    });

    it('should invalidate equations without the variable', () => {
      const args = {
        equation: 'y^2+2y-3=0',
        variable: 'x',
      };

      const result = validateSolveEquationArguments(args);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('does not contain the variable');
    });

    it('should invalidate invalid variable names', () => {
      const args = {
        equation: 'x^2+2x-3=0',
        variable: '123x', // Starts with a number
      };

      const result = validateSolveEquationArguments(args);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid variable name');
    });
  });

  describe('containsUnsafeExpression', () => {
    it('should detect eval', () => {
      expect(containsUnsafeExpression('eval("alert(1)")')).toBe(true);
    });

    it('should detect setTimeout', () => {
      expect(containsUnsafeExpression('setTimeout(function() {}, 1000)')).toBe(true);
    });

    it('should detect setInterval', () => {
      expect(containsUnsafeExpression('setInterval(function() {}, 1000)')).toBe(true);
    });

    it('should detect Function constructor', () => {
      expect(containsUnsafeExpression('new Function("return 1")')).toBe(true);
    });

    it('should detect require', () => {
      expect(containsUnsafeExpression('require("fs")')).toBe(true);
    });

    it('should detect import', () => {
      expect(containsUnsafeExpression('import("fs")')).toBe(true);
    });

    it('should detect process', () => {
      expect(containsUnsafeExpression('process.env')).toBe(true);
    });

    it('should detect global', () => {
      expect(containsUnsafeExpression('global.process')).toBe(true);
    });

    it('should detect window', () => {
      expect(containsUnsafeExpression('window.location')).toBe(true);
    });

    it('should detect document', () => {
      expect(containsUnsafeExpression('document.cookie')).toBe(true);
    });

    it('should detect console', () => {
      expect(containsUnsafeExpression('console.log("hello")')).toBe(true);
    });

    it('should detect __proto__', () => {
      expect(containsUnsafeExpression('obj.__proto__')).toBe(true);
    });

    it('should detect constructor', () => {
      expect(containsUnsafeExpression('obj.constructor()')).toBe(true);
    });

    it('should not detect safe expressions', () => {
      expect(containsUnsafeExpression('y=x^2+2*x-3')).toBe(false);
      expect(containsUnsafeExpression('sin(x)+cos(x)')).toBe(false);
      expect(containsUnsafeExpression('sqrt(x^2+y^2)')).toBe(false);
    });
  });

  describe('isValidMathExpression', () => {
    it('should validate simple expressions', () => {
      expect(isValidMathExpression('y=x^2')).toBe(true);
      expect(isValidMathExpression('sin(x)+cos(x)')).toBe(true);
      expect(isValidMathExpression('sqrt(x^2+y^2)')).toBe(true);
    });

    it('should validate complex expressions', () => {
      expect(isValidMathExpression('y=sin(x)^2+cos(x)^2')).toBe(true);
      expect(isValidMathExpression('y=exp(-x^2/2)/sqrt(2*pi)')).toBe(true);
      expect(isValidMathExpression('y=(x^3-3*x)/(x^2+1)')).toBe(true);
    });

    it('should invalidate expressions with unbalanced parentheses', () => {
      expect(isValidMathExpression('y=x^2)')).toBe(false);
      expect(isValidMathExpression('y=sin(x')).toBe(false);
      expect(isValidMathExpression('y=(x+1))')).toBe(false);
    });

    it('should invalidate expressions with invalid operator sequences', () => {
      expect(isValidMathExpression('y=x++1')).toBe(false);
      expect(isValidMathExpression('y=x**2')).toBe(false); // ** is not a valid operator in our context
      expect(isValidMathExpression('y=x+-2')).toBe(false);
    });

    it('should invalidate expressions with unknown functions', () => {
      expect(isValidMathExpression('y=foo(x)')).toBe(false);
      expect(isValidMathExpression('y=unknown(x+1)')).toBe(false);
      expect(isValidMathExpression('y=hack(x)')).toBe(false);
    });
  });
});

