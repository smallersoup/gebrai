import { ToolRegistry } from '../../src/tools';
import { GeoGebraInstance } from '../../src/utils/geogebra-instance';

// Mock GeoGebraInstance
jest.mock('../../src/utils/geogebra-instance');

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockGeoGebraInstance: jest.Mocked<GeoGebraInstance>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock GeoGebra instance
    mockGeoGebraInstance = {
      evalCommand: jest.fn(),
      getAllObjectNames: jest.fn(),
      getObjectInfo: jest.fn(),
      newConstruction: jest.fn(),
      exportPNG: jest.fn(),
      exportSVG: jest.fn(),
      exportPDF: jest.fn(),
      isReady: jest.fn(),
      cleanup: jest.fn(),
      getState: jest.fn(),
    } as any;

    // Mock the GeoGebraInstance constructor
    (GeoGebraInstance as jest.MockedClass<typeof GeoGebraInstance>).mockImplementation(() => mockGeoGebraInstance);
    
    registry = new ToolRegistry();
  });

  describe('Tool Registration', () => {
    it('should register all expected GeoGebra tools', () => {
      const tools = registry.getTools();
      const toolNames = tools.map(tool => tool.name);

      expect(toolNames).toContain('geogebra_eval_command');
      expect(toolNames).toContain('geogebra_create_point');
      expect(toolNames).toContain('geogebra_create_line');
      expect(toolNames).toContain('geogebra_get_objects');
      expect(toolNames).toContain('geogebra_clear_construction');
      expect(toolNames).toContain('geogebra_instance_status');
      expect(toolNames).toContain('geogebra_export_png');
      expect(toolNames).toContain('geogebra_export_svg');
      expect(toolNames).toContain('geogebra_export_pdf');
      expect(toolNames).toContain('ping');
    });

    it('should return tool count', () => {
      const tools = registry.getTools();
      expect(tools.length).toBeGreaterThan(0);
      expect(typeof tools.length).toBe('number');
    });

    it('should have tools with correct structure', () => {
      const tools = registry.getTools();
      
      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });
  });

  describe('Tool Execution', () => {
    describe('ping tool', () => {
      it('should execute ping successfully', async () => {
        const result = await registry.executeTool('ping', {});
        
        expect(result.content).toBeDefined();
        expect(result.content[0]).toBeDefined();
        expect(result.content[0]?.type).toBe('text');
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.message).toBe('pong');
        expect(response.timestamp).toBeDefined();
      });
    });

    describe('geogebra_instance_status tool', () => {
      it('should return instance status', async () => {
        mockGeoGebraInstance.isReady.mockResolvedValue(true);
        mockGeoGebraInstance.getState.mockReturnValue({
          id: 'test-id',
          isReady: true,
          lastActivity: new Date(),
          config: { appName: 'graphing' }
        });

        const result = await registry.executeTool('geogebra_instance_status', {});
        
        expect(result.content).toBeDefined();
        expect(result.content[0]).toBeDefined();
        expect(result.content[0]?.type).toBe('text');
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.ready).toBe(true);
        expect(response.instanceId).toBe('test-id');
      });

      it('should handle not ready instance', async () => {
        mockGeoGebraInstance.isReady.mockResolvedValue(false);
        mockGeoGebraInstance.getState.mockReturnValue({
          id: 'test-id',
          isReady: false,
          lastActivity: new Date(),
          config: { appName: 'graphing' }
        });

        const result = await registry.executeTool('geogebra_instance_status', {});
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.ready).toBe(false);
      });
    });

    describe('geogebra_eval_command tool', () => {
      it('should execute command successfully', async () => {
        const mockResult = {
          success: true,
          result: 'command executed'
        };
        mockGeoGebraInstance.evalCommand.mockResolvedValue(mockResult);

        const result = await registry.executeTool('geogebra_eval_command', {
          command: 'A = (1, 2)'
        });
        
        expect(mockGeoGebraInstance.evalCommand).toHaveBeenCalledWith('A = (1, 2)');
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
      });

      it('should handle command execution failure', async () => {
        const mockResult = {
          success: false,
          error: 'Command failed'
        };
        mockGeoGebraInstance.evalCommand.mockResolvedValue(mockResult);

        const result = await registry.executeTool('geogebra_eval_command', {
          command: 'InvalidCommand'
        });
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(false);
        expect(response.error).toBe('Command failed');
      });

      it('should require command parameter', async () => {
        await expect(registry.executeTool('geogebra_eval_command', {})).rejects.toThrow();
      });
    });

    describe('geogebra_create_point tool', () => {
      it('should create point successfully', async () => {
        const mockResult = {
          success: true,
          result: 'point created'
        };
        mockGeoGebraInstance.evalCommand.mockResolvedValue(mockResult);

        const result = await registry.executeTool('geogebra_create_point', {
          name: 'B',
          x: 3,
          y: 4
        });
        
        expect(mockGeoGebraInstance.evalCommand).toHaveBeenCalledWith('B = (3, 4)');
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
      });

      it('should handle point creation with z coordinate', async () => {
        const mockResult = {
          success: true,
          result: 'point created'
        };
        mockGeoGebraInstance.evalCommand.mockResolvedValue(mockResult);

        await registry.executeTool('geogebra_create_point', {
          name: 'C',
          x: 1,
          y: 2,
          z: 3
        });
        
        expect(mockGeoGebraInstance.evalCommand).toHaveBeenCalledWith('C = (1, 2, 3)');
      });

      it('should require name, x, and y parameters', async () => {
        await expect(registry.executeTool('geogebra_create_point', { x: 1, y: 2 })).rejects.toThrow();
        await expect(registry.executeTool('geogebra_create_point', { name: 'A', y: 2 })).rejects.toThrow();
        await expect(registry.executeTool('geogebra_create_point', { name: 'A', x: 1 })).rejects.toThrow();
      });
    });

    describe('geogebra_get_objects tool', () => {
      it('should get all objects', async () => {
        const mockObjects = ['A', 'B', 'line1'];
        mockGeoGebraInstance.getAllObjectNames.mockResolvedValue(mockObjects);
        mockGeoGebraInstance.getObjectInfo.mockImplementation((name: string) => 
          Promise.resolve({
            name,
            type: name.startsWith('line') ? 'line' : 'point',
            visible: true,
            defined: true
          })
        );

        await registry.executeTool('geogebra_get_objects', {});
        
        expect(mockGeoGebraInstance.getAllObjectNames).toHaveBeenCalled();
      });

      it('should filter objects by type', async () => {
        const mockObjects = ['A', 'B'];
        mockGeoGebraInstance.getAllObjectNames.mockResolvedValue(mockObjects);

        await registry.executeTool('geogebra_get_objects', {
          type: 'point'
        });
        
        expect(mockGeoGebraInstance.getAllObjectNames).toHaveBeenCalledWith('point');
      });

      it('should handle empty object list', async () => {
        mockGeoGebraInstance.getAllObjectNames.mockResolvedValue([]);

        const result = await registry.executeTool('geogebra_get_objects', {});
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.objectCount).toBe(0);
        expect(response.objects).toEqual([]);
      });
    });

    describe('geogebra_export_png tool', () => {
      it('should export PNG successfully', async () => {
        const mockBase64 = 'base64-encoded-image-data';
        mockGeoGebraInstance.exportPNG.mockResolvedValue(mockBase64);

        await registry.executeTool('geogebra_export_png', {
          scale: 2
        });
        
        expect(mockGeoGebraInstance.exportPNG).toHaveBeenCalledWith(2);
      });

      it('should use default scale', async () => {
        const mockBase64 = 'base64-encoded-image-data';
        mockGeoGebraInstance.exportPNG.mockResolvedValue(mockBase64);

        await registry.executeTool('geogebra_export_png', {});
        
        expect(mockGeoGebraInstance.exportPNG).toHaveBeenCalledWith(1);
      });

      it('should handle export failure', async () => {
        mockGeoGebraInstance.exportPNG.mockRejectedValue(new Error('Export failed'));

        await expect(registry.executeTool('geogebra_export_png', {})).rejects.toThrow();
      });
    });

    describe('geogebra_clear_construction tool', () => {
      it('should clear construction successfully', async () => {
        mockGeoGebraInstance.newConstruction.mockResolvedValue();

        const result = await registry.executeTool('geogebra_clear_construction', {});
        
        expect(mockGeoGebraInstance.newConstruction).toHaveBeenCalled();
        
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
        expect(response.message).toBe('Construction cleared successfully');
      });

      it('should handle clear failure', async () => {
        mockGeoGebraInstance.newConstruction.mockRejectedValue(new Error('Clear failed'));

        await expect(registry.executeTool('geogebra_clear_construction', {})).rejects.toThrow();
      });
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unknown tool', async () => {
      await expect(registry.executeTool('unknown_tool', {})).rejects.toThrow('Tool not found: unknown_tool');
    });

    it('should handle tool execution errors', async () => {
      mockGeoGebraInstance.evalCommand.mockRejectedValue(new Error('Execution failed'));

      await expect(registry.executeTool('geogebra_eval_command', {
        command: 'A = (1, 2)'
      })).rejects.toThrow();
    });
  });

  describe('Tool Lookup', () => {
    it('should find existing tools', () => {
      const tools = registry.getTools();
      
      expect(tools.find(t => t.name === 'ping')).toBeDefined();
      expect(tools.find(t => t.name === 'geogebra_eval_command')).toBeDefined();
      expect(tools.find(t => t.name === 'geogebra_export_png')).toBeDefined();
    });

    it('should return undefined for non-existent tools', () => {
      const tools = registry.getTools();
      
      expect(tools.find(t => t.name === 'non_existent_tool')).toBeUndefined();
    });
  });
}); 