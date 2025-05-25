import { ToolDefinition } from '../types/mcp';
import { MockGeoGebraInstance } from '../utils/geogebra-mock';
// import { GeoGebraInstance } from '../utils/geogebra-instance'; // Real implementation (requires browser)
import logger from '../utils/logger';

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
      description: 'Create a line in GeoGebra through two points',
      inputSchema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Name of the line (e.g., "l", "line1")'
          },
          point1: {
            type: 'string',
            description: 'Name of the first point'
          },
          point2: {
            type: 'string',
            description: 'Name of the second point'
          }
        },
        required: ['name', 'point1', 'point2']
      }
    },
    handler: async (params) => {
      try {
        const name = params['name'] as string;
        const point1 = params['point1'] as string;
        const point2 = params['point2'] as string;
        
        const command = `${name} = Line(${point1}, ${point2})`;
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
                line: lineInfo
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
      description: 'Export the current GeoGebra construction as PNG (base64)',
      inputSchema: {
        type: 'object',
        properties: {
          scale: {
            type: 'number',
            description: 'Scale factor for the exported image (default: 1)',
            minimum: 0.1,
            maximum: 5
          }
        },
        required: []
      }
    },
    handler: async (params) => {
      try {
        const scale = (params['scale'] as number) || 1;
        const instance = await instancePool.getDefaultInstance();
        
        const pngBase64 = await instance.exportPNG(scale);
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              format: 'PNG',
              scale,
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
      description: 'Export the current GeoGebra construction as SVG',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      }
    },
    handler: async (_params) => {
      try {
        const instance = await instancePool.getDefaultInstance();
        
        const svg = await instance.exportSVG();
        
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              format: 'SVG',
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
  }
]; 