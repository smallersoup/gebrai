import { ToolDefinition } from '../types/mcp';
import { MockGeoGebraInstance } from '../utils/geogebra-mock';
// import { GeoGebraInstance } from '../utils/geogebra-instance'; // Real implementation (requires browser)
import logger from '../utils/logger';
import { 
  validateObjectName, 
  validateCoordinates, 
  validateRadius, 
  validatePolygonVertices, 
  validateLinearEquation,
  validateFunctionExpression,
  validateParametricExpressions,
  validateImplicitExpression,
  validateDomainRange,
  validateFunctionStyling 
} from '../utils/validation';

// Global instance pool for managing GeoGebra instances
class GeoGebraInstancePool {
  private instances: Map<string, MockGeoGebraInstance> = new Map();
  private defaultInstance: MockGeoGebraInstance | undefined;

  async getDefaultInstance(): Promise<MockGeoGebraInstance> {
    if (!this.defaultInstance) {
      this.defaultInstance = new MockGeoGebraInstance({
        appName: 'graphing',
        width: 800,
        height: 600,
        showMenuBar: false,
        showToolBar: false,
        showAlgebraInput: false
      });
      
      try {
        await this.defaultInstance.initialize();
        logger.info('Default Mock GeoGebra instance initialized');
      } catch (error) {
        logger.error('Failed to initialize default GeoGebra instance', error);
        throw error;
      }
    }
    
    return this.defaultInstance;
  }

  async cleanup(): Promise<void> {
    if (this.defaultInstance) {
      await this.defaultInstance.cleanup();
      this.defaultInstance = undefined;
    }
    
    for (const instance of this.instances.values()) {
      await instance.cleanup();
    }
    this.instances.clear();
  }
}

const instancePool = new GeoGebraInstancePool();

// Cleanup on process exit
process.on('exit', () => {
  instancePool.cleanup();
});

process.on('SIGINT', () => {
  instancePool.cleanup();
  process.exit(0);
});

/**
 * GeoGebra MCP Tools
 */
export const geogebraTools: ToolDefinition[] = [
  {
    tool: {
      name: 'geogebra_eval_command',
      description: 'Execute a GeoGebra command and return the result',
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The GeoGebra command to execute (e.g., "A = (1, 2)", "f(x) = x^2")'
          }
        },
        required: ['command']
      }
    },
    handler: async (params) => {
      try {
        const command = params['command'] as string;
        const instance = await instancePool.getDefaultInstance();
        
        const result = await instance.evalCommand(command);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: result.success,
              command,
              result: result.result,
              error: result.error
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to execute GeoGebra command', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },
  
  {
    tool: {
      name: 'geogebra_create_point',
      description: 'Create a point in GeoGebra with specified coordinates',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the point (e.g., "A", "P1")'
          },
          x: {
            type: 'number',
            description: 'X coordinate of the point'
          },
          y: {
            type: 'number',
            description: 'Y coordinate of the point'
          }
        },
        required: ['name', 'x', 'y']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const x = params['x'] as number;
        const y = params['y'] as number;
        
        // Validate parameters
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid name: ${nameValidation.error}`);
        }
        
        const coordValidation = validateCoordinates(x, y);
        if (!coordValidation.isValid) {
          throw new Error(`Invalid coordinates: ${coordValidation.error}`);
        }
        
        const command = `${name} = (${x}, ${y})`;
        const instance = await instancePool.getDefaultInstance();
        
        const result = await instance.evalCommand(command);
        
        if (result.success) {
          const pointInfo = await instance.getObjectInfo(name);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                command,
                point: pointInfo
              }, null, 2)
            }]
          };
        } else {
          throw new Error(result.error || 'Failed to create point');
        }
      } catch (error) {
        logger.error('Failed to create point', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_create_line',
      description: 'Create a line in GeoGebra through two points or from an equation',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the line (e.g., "l", "line1")'
          },
          point1: {
            type: 'string',
            description: 'Name of the first point (for two-point method)'
          },
          point2: {
            type: 'string',
            description: 'Name of the second point (for two-point method)'
          },
          equation: {
            type: 'string',
            description: 'Linear equation (e.g., "y = 2x + 3", "x + y = 5") for equation method'
          }
        },
        required: ['name'],
        oneOf: [
          {
            required: ['name', 'point1', 'point2']
          },
          {
            required: ['name', 'equation']
          }
        ]
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const point1 = params['point1'] as string;
        const point2 = params['point2'] as string;
        const equation = params['equation'] as string;
        
        // Validate line name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid line name: ${nameValidation.error}`);
        }
        
        let command: string;
        
        // Validate parameters based on method
        if (point1 && point2) {
          // Two-point method - validate point names
          const point1Validation = validateObjectName(point1);
          if (!point1Validation.isValid) {
            throw new Error(`Invalid first point name: ${point1Validation.error}`);
          }
          
          const point2Validation = validateObjectName(point2);
          if (!point2Validation.isValid) {
            throw new Error(`Invalid second point name: ${point2Validation.error}`);
          }
          
          command = `${name} = Line(${point1}, ${point2})`;
        } else if (equation) {
          // Equation method - validate equation format
          const equationValidation = validateLinearEquation(equation);
          if (!equationValidation.isValid) {
            throw new Error(`Invalid equation: ${equationValidation.error}`);
          }
          
          // For equation-based lines, we define them directly
          command = `${name}: ${equation}`;
        } else {
          throw new Error('Either provide two points or an equation for the line');
        }
        
        const instance = await instancePool.getDefaultInstance();
        const result = await instance.evalCommand(command);
        
        if (result.success) {
          const lineInfo = await instance.getObjectInfo(name);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                command,
                line: lineInfo,
                method: point1 && point2 ? 'two-point' : 'equation'
              }, null, 2)
            }]
          };
        } else {
          throw new Error(result.error || 'Failed to create line');
        }
      } catch (error) {
        logger.error('Failed to create line', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_create_circle',
      description: 'Create a circle in GeoGebra with center and radius, or through three points',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the circle (e.g., "c", "circle1")'
          },
          center: {
            type: 'string',
            description: 'Name of the center point (required for center-radius method)'
          },
          radius: {
            type: 'number',
            description: 'Radius of the circle (required for center-radius method)',
            minimum: 0
          },
          point1: {
            type: 'string',
            description: 'First point for three-point circle method'
          },
          point2: {
            type: 'string',
            description: 'Second point for three-point circle method'
          },
          point3: {
            type: 'string',
            description: 'Third point for three-point circle method'
          }
        },
        required: ['name'],
        oneOf: [
          {
            required: ['name', 'center', 'radius']
          },
          {
            required: ['name', 'point1', 'point2', 'point3']
          }
        ]
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const center = params['center'] as string;
        const radius = params['radius'] as number;
        const point1 = params['point1'] as string;
        const point2 = params['point2'] as string;
        const point3 = params['point3'] as string;
        
        // Validate circle name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid circle name: ${nameValidation.error}`);
        }
        
        let command: string;
        
        // Validate parameters based on method
        if (center && radius !== undefined) {
          // Center-radius method
          const centerValidation = validateObjectName(center);
          if (!centerValidation.isValid) {
            throw new Error(`Invalid center point name: ${centerValidation.error}`);
          }
          
          const radiusValidation = validateRadius(radius);
          if (!radiusValidation.isValid) {
            throw new Error(`Invalid radius: ${radiusValidation.error}`);
          }
          
          command = `${name} = Circle(${center}, ${radius})`;
        } else if (point1 && point2 && point3) {
          // Three-point method - validate all point names
          const points = [
            { name: point1, label: 'first' },
            { name: point2, label: 'second' },
            { name: point3, label: 'third' }
          ];
          
          for (const point of points) {
            if (!point.name) {
              throw new Error(`${point.label} point name is required`);
            }
            const pointValidation = validateObjectName(point.name);
            if (!pointValidation.isValid) {
              throw new Error(`Invalid ${point.label} point name: ${pointValidation.error}`);
            }
          }
          
          command = `${name} = Circle(${point1}, ${point2}, ${point3})`;
        } else {
          throw new Error('Either provide center and radius, or three points for the circle');
        }
        
        const instance = await instancePool.getDefaultInstance();
        const result = await instance.evalCommand(command);
        
        if (result.success) {
          const circleInfo = await instance.getObjectInfo(name);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                command,
                circle: circleInfo
              }, null, 2)
            }]
          };
        } else {
          throw new Error(result.error || 'Failed to create circle');
        }
      } catch (error) {
        logger.error('Failed to create circle', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_create_polygon',
      description: 'Create a polygon in GeoGebra with variable number of vertices',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the polygon (e.g., "poly", "triangle1")'
          },
          vertices: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of point names that form the vertices of the polygon',
            minItems: 3
          }
        },
        required: ['name', 'vertices']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const vertices = params['vertices'] as string[];
        
        // Validate polygon name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid polygon name: ${nameValidation.error}`);
        }
        
        // Validate vertices
        const verticesValidation = validatePolygonVertices(vertices);
        if (!verticesValidation.isValid) {
          throw new Error(verticesValidation.error);
        }
        
        const verticesStr = vertices.join(', ');
        const command = `${name} = Polygon(${verticesStr})`;
        
        const instance = await instancePool.getDefaultInstance();
        const result = await instance.evalCommand(command);
        
        if (result.success) {
          const polygonInfo = await instance.getObjectInfo(name);
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                command,
                polygon: polygonInfo,
                vertexCount: vertices.length
              }, null, 2)
            }]
          };
        } else {
          throw new Error(result.error || 'Failed to create polygon');
        }
      } catch (error) {
        logger.error('Failed to create polygon', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_get_objects',
      description: 'Get all objects in the current GeoGebra construction',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Optional: filter by object type (e.g., "point", "line", "circle")'
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const type = params['type'] as string | undefined;
        const instance = await instancePool.getDefaultInstance();
        
        const objectNames = await instance.getAllObjectNames(type);
        const objects = [];
        
        for (const name of objectNames) {
          const info = await instance.getObjectInfo(name);
          if (info) {
            objects.push(info);
          }
        }
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              objectCount: objects.length,
              objects
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get objects', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_clear_construction',
      description: 'Clear all objects from the GeoGebra construction',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        await instance.newConstruction();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              message: 'Construction cleared successfully'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to clear construction', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_instance_status',
      description: 'Get the status of the GeoGebra instance',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        const isReady = await instance.isReady();
        const state = instance.getState();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              status: {
                isReady,
                instanceId: state.id,
                lastActivity: state.lastActivity,
                config: state.config
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to get instance status', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_export_png',
      description: 'Export the current GeoGebra construction as PNG with configurable dimensions, quality, and view settings',
      inputSchema: {
        type: 'object',
        properties: {
          scale: {
            type: 'number',
            description: 'Scale factor for the exported image (default: 1)',
            minimum: 0.1,
            maximum: 10
          },
          width: {
            type: 'number',
            description: 'Width of the exported image in pixels (overrides scale if specified)',
            minimum: 100,
            maximum: 5000
          },
          height: {
            type: 'number',
            description: 'Height of the exported image in pixels (overrides scale if specified)',
            minimum: 100,
            maximum: 5000
          },
          transparent: {
            type: 'boolean',
            description: 'Whether the background should be transparent (default: false)'
          },
          dpi: {
            type: 'number',
            description: 'Dots per inch for the exported image (default: 72)',
            minimum: 72,
            maximum: 300
          },
          xmin: {
            type: 'number',
            description: 'Minimum x-coordinate for view range'
          },
          xmax: {
            type: 'number',
            description: 'Maximum x-coordinate for view range'
          },
          ymin: {
            type: 'number',
            description: 'Minimum y-coordinate for view range'
          },
          ymax: {
            type: 'number',
            description: 'Maximum y-coordinate for view range'
          },
          showAxes: {
            type: 'boolean',
            description: 'Whether to show coordinate axes (default: true)'
          },
          showGrid: {
            type: 'boolean',
            description: 'Whether to show coordinate grid (default: false)'
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const scale = (params['scale'] as number) || 1;
        const width = params['width'] as number;
        const height = params['height'] as number;
        const transparent = (params['transparent'] as boolean) || false;
        const dpi = (params['dpi'] as number) || 72;
        const xmin = params['xmin'] as number;
        const xmax = params['xmax'] as number;
        const ymin = params['ymin'] as number;
        const ymax = params['ymax'] as number;
        const showAxes = params['showAxes'] !== undefined ? (params['showAxes'] as boolean) : true;
        const showGrid = (params['showGrid'] as boolean) || false;
        
        const instance = await instancePool.getDefaultInstance();
        
        // Apply view settings if specified
        if (xmin !== undefined && xmax !== undefined && ymin !== undefined && ymax !== undefined) {
          await instance.setCoordSystem(xmin, xmax, ymin, ymax);
        }
        
        if (params['showAxes'] !== undefined) {
          await instance.setAxesVisible(showAxes, showAxes);
        }
        
        if (params['showGrid'] !== undefined) {
          await instance.setGridVisible(showGrid);
        }
        
        // Export with enhanced parameters
        const pngBase64 = await instance.exportPNG(scale, transparent, dpi, width, height);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              format: 'PNG',
              scale,
              width,
              height,
              transparent,
              dpi,
              viewSettings: {
                coordSystem: (xmin !== undefined && xmax !== undefined && ymin !== undefined && ymax !== undefined) ? { xmin, xmax, ymin, ymax } : undefined,
                showAxes,
                showGrid
              },
              data: pngBase64,
              encoding: 'base64'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to export PNG', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_export_svg',
      description: 'Export the current GeoGebra construction as SVG with configurable view settings',
      inputSchema: {
        type: 'object',
        properties: {
          xmin: {
            type: 'number',
            description: 'Minimum x-coordinate for view range'
          },
          xmax: {
            type: 'number',
            description: 'Maximum x-coordinate for view range'
          },
          ymin: {
            type: 'number',
            description: 'Minimum y-coordinate for view range'
          },
          ymax: {
            type: 'number',
            description: 'Maximum y-coordinate for view range'
          },
          showAxes: {
            type: 'boolean',
            description: 'Whether to show coordinate axes (default: true)'
          },
          showGrid: {
            type: 'boolean',
            description: 'Whether to show coordinate grid (default: false)'
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const xmin = params['xmin'] as number;
        const xmax = params['xmax'] as number;
        const ymin = params['ymin'] as number;
        const ymax = params['ymax'] as number;
        const showAxes = params['showAxes'] !== undefined ? (params['showAxes'] as boolean) : true;
        const showGrid = (params['showGrid'] as boolean) || false;
        
        const instance = await instancePool.getDefaultInstance();
        
        // Apply view settings if specified
        if (xmin !== undefined && xmax !== undefined && ymin !== undefined && ymax !== undefined) {
          await instance.setCoordSystem(xmin, xmax, ymin, ymax);
        }
        
        if (params['showAxes'] !== undefined) {
          await instance.setAxesVisible(showAxes, showAxes);
        }
        
        if (params['showGrid'] !== undefined) {
          await instance.setGridVisible(showGrid);
        }
        
        const svg = await instance.exportSVG();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              format: 'SVG',
              viewSettings: {
                coordSystem: (xmin !== undefined && xmax !== undefined && ymin !== undefined && ymax !== undefined) ? { xmin, xmax, ymin, ymax } : undefined,
                showAxes,
                showGrid
              },
              data: svg,
              encoding: 'utf8'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to export SVG', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_export_pdf',
      description: 'Export the current GeoGebra construction as PDF (base64)',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        
        const pdfBase64 = await instance.exportPDF();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              format: 'PDF',
              data: pdfBase64,
              encoding: 'base64'
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to export PDF', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_plot_function',
      description: 'Plot a mathematical function f(x) = expression with configurable domain and styling',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the function (e.g., "f", "g", "func1")'
          },
          expression: {
            type: 'string',
            description: 'Mathematical expression in terms of x (e.g., "x^2", "sin(x)", "2*x + 3")'
          },
          xMin: {
            type: 'number',
            description: 'Minimum x value for the domain (optional)'
          },
          xMax: {
            type: 'number',
            description: 'Maximum x value for the domain (optional)'
          },
          color: {
            type: 'string',
            description: 'Color of the function graph (hex, rgb, or color name)'
          },
          thickness: {
            type: 'number',
            description: 'Line thickness (1-10)',
            minimum: 1,
            maximum: 10
          },
          style: {
            type: 'string',
            description: 'Line style',
            enum: ['solid', 'dashed', 'dotted']
          }
        },
        required: ['name', 'expression']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const expression = params['expression'] as string;
        const xMin = params['xMin'] as number | undefined;
        const xMax = params['xMax'] as number | undefined;
        const color = params['color'] as string | undefined;
        const thickness = params['thickness'] as number | undefined;
        const style = params['style'] as string | undefined;

        // Validate function name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid function name: ${nameValidation.error}`);
        }

        // Validate function expression
        const exprValidation = validateFunctionExpression(expression);
        if (!exprValidation.isValid) {
          throw new Error(`Invalid expression: ${exprValidation.error}`);
        }

        // Validate domain if provided
        if (xMin !== undefined && xMax !== undefined) {
          const domainValidation = validateDomainRange(xMin, xMax, 'x');
          if (!domainValidation.isValid) {
            throw new Error(`Invalid domain: ${domainValidation.error}`);
          }
        }

        // Validate styling if provided
        const styleValidation = validateFunctionStyling(color, thickness, style);
        if (!styleValidation.isValid) {
          throw new Error(`Invalid styling: ${styleValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the function
        let command: string;
        if (xMin !== undefined && xMax !== undefined) {
          // Function with domain restriction
          command = `${name}(x) = If(${xMin} <= x <= ${xMax}, ${expression}, ?)`;
        } else {
          // Standard function
          command = `${name}(x) = ${expression}`;
        }

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create function');
        }

        // Apply styling if provided
        const styleCommands: string[] = [];
        
        if (color) {
          styleCommands.push(`SetColor(${name}, "${color}")`);
        }
        
        if (thickness) {
          styleCommands.push(`SetLineThickness(${name}, ${thickness})`);
        }
        
        if (style && style !== 'solid') {
          const lineType = style === 'dashed' ? '10' : '20'; // GeoGebra line types
          styleCommands.push(`SetLineStyle(${name}, ${lineType})`);
        }

        // Execute styling commands
        for (const styleCmd of styleCommands) {
          await instance.evalCommand(styleCmd);
        }

        const functionInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              function: functionInfo,
              domain: (xMin !== undefined && xMax !== undefined) ? { xMin, xMax } : undefined,
              styling: {
                color,
                thickness,
                style
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to plot function', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_plot_parametric',
      description: 'Plot a parametric curve defined by x(t) and y(t) with configurable parameter range and styling',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the parametric curve (e.g., "curve1", "c")'
          },
          xExpression: {
            type: 'string',
            description: 'X-coordinate expression in terms of parameter (e.g., "cos(t)", "t")'
          },
          yExpression: {
            type: 'string',
            description: 'Y-coordinate expression in terms of parameter (e.g., "sin(t)", "t^2")'
          },
          parameter: {
            type: 'string',
            description: 'Parameter variable name (default: "t")',
            default: 't'
          },
          tMin: {
            type: 'number',
            description: 'Minimum parameter value'
          },
          tMax: {
            type: 'number',
            description: 'Maximum parameter value'
          },
          color: {
            type: 'string',
            description: 'Color of the curve (hex, rgb, or color name)'
          },
          thickness: {
            type: 'number',
            description: 'Line thickness (1-10)',
            minimum: 1,
            maximum: 10
          },
          style: {
            type: 'string',
            description: 'Line style',
            enum: ['solid', 'dashed', 'dotted']
          }
        },
        required: ['name', 'xExpression', 'yExpression', 'tMin', 'tMax']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const xExpression = params['xExpression'] as string;
        const yExpression = params['yExpression'] as string;
        const parameter = (params['parameter'] as string) || 't';
        const tMin = params['tMin'] as number;
        const tMax = params['tMax'] as number;
        const color = params['color'] as string | undefined;
        const thickness = params['thickness'] as number | undefined;
        const style = params['style'] as string | undefined;

        // Validate curve name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid curve name: ${nameValidation.error}`);
        }

        // Validate parametric expressions
        const exprValidation = validateParametricExpressions(xExpression, yExpression, parameter);
        if (!exprValidation.isValid) {
          throw new Error(`Invalid expressions: ${exprValidation.error}`);
        }

        // Validate parameter range
        const rangeValidation = validateDomainRange(tMin, tMax, parameter);
        if (!rangeValidation.isValid) {
          throw new Error(`Invalid parameter range: ${rangeValidation.error}`);
        }

        // Validate styling if provided
        const styleValidation = validateFunctionStyling(color, thickness, style);
        if (!styleValidation.isValid) {
          throw new Error(`Invalid styling: ${styleValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the parametric curve using GeoGebra's Curve command
        const command = `${name} = Curve(${xExpression}, ${yExpression}, ${parameter}, ${tMin}, ${tMax})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create parametric curve');
        }

        // Apply styling if provided
        const styleCommands: string[] = [];
        
        if (color) {
          styleCommands.push(`SetColor(${name}, "${color}")`);
        }
        
        if (thickness) {
          styleCommands.push(`SetLineThickness(${name}, ${thickness})`);
        }
        
        if (style && style !== 'solid') {
          const lineType = style === 'dashed' ? '10' : '20';
          styleCommands.push(`SetLineStyle(${name}, ${lineType})`);
        }

        // Execute styling commands
        for (const styleCmd of styleCommands) {
          await instance.evalCommand(styleCmd);
        }

        const curveInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              curve: curveInfo,
              parametric: {
                xExpression,
                yExpression,
                parameter,
                range: { tMin, tMax }
              },
              styling: {
                color,
                thickness,
                style
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to plot parametric curve', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  },

  {
    tool: {
      name: 'geogebra_plot_implicit',
      description: 'Plot an implicit curve defined by F(x,y) = 0 with configurable styling',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the implicit curve (e.g., "implicit1", "curve")'
          },
          expression: {
            type: 'string',
            description: 'Implicit expression in terms of x and y (e.g., "x^2 + y^2 - 4", "x^2/4 + y^2/9 - 1")'
          },
          color: {
            type: 'string',
            description: 'Color of the curve (hex, rgb, or color name)'
          },
          thickness: {
            type: 'number',
            description: 'Line thickness (1-10)',
            minimum: 1,
            maximum: 10
          },
          style: {
            type: 'string',
            description: 'Line style',
            enum: ['solid', 'dashed', 'dotted']
          }
        },
        required: ['name', 'expression']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const expression = params['expression'] as string;
        const color = params['color'] as string | undefined;
        const thickness = params['thickness'] as number | undefined;
        const style = params['style'] as string | undefined;

        // Validate curve name
        const nameValidation = validateObjectName(name);
        if (!nameValidation.isValid) {
          throw new Error(`Invalid curve name: ${nameValidation.error}`);
        }

        // Validate implicit expression
        const exprValidation = validateImplicitExpression(expression);
        if (!exprValidation.isValid) {
          throw new Error(`Invalid expression: ${exprValidation.error}`);
        }

        // Validate styling if provided
        const styleValidation = validateFunctionStyling(color, thickness, style);
        if (!styleValidation.isValid) {
          throw new Error(`Invalid styling: ${styleValidation.error}`);
        }

        const instance = await instancePool.getDefaultInstance();

        // Create the implicit curve using GeoGebra's ImplicitCurve command
        const command = `${name} = ImplicitCurve(${expression})`;

        const result = await instance.evalCommand(command);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to create implicit curve');
        }

        // Apply styling if provided
        const styleCommands: string[] = [];
        
        if (color) {
          styleCommands.push(`SetColor(${name}, "${color}")`);
        }
        
        if (thickness) {
          styleCommands.push(`SetLineThickness(${name}, ${thickness})`);
        }
        
        if (style && style !== 'solid') {
          const lineType = style === 'dashed' ? '10' : '20';
          styleCommands.push(`SetLineStyle(${name}, ${lineType})`);
        }

        // Execute styling commands
        for (const styleCmd of styleCommands) {
          await instance.evalCommand(styleCmd);
        }

        const curveInfo = await instance.getObjectInfo(name);

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              command,
              curve: curveInfo,
              implicit: {
                expression
              },
              styling: {
                color,
                thickness,
                style
              }
            }, null, 2)
          }]
        };
      } catch (error) {
        logger.error('Failed to plot implicit curve', error);
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }],
          isError: true
        };
      }
    }
  }
]; 