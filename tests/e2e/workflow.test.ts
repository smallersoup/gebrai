import { ToolRegistry } from '../../src/tools';
import { McpServer } from '../../src/server';
import { McpServerConfig } from '../../src/types/mcp';

describe('End-to-End Workflow Tests', () => {
  let server: McpServer;
  let registry: ToolRegistry;

  beforeAll(async () => {
    // Initialize server for E2E testing
    const config: McpServerConfig = {
      name: 'GeoGebra MCP Server E2E Test',
      version: '1.0.0',
      description: 'End-to-end testing server',
      logLevel: 'error'
    };
    
    server = new McpServer(config);
    registry = new ToolRegistry();
    
    // Start server for E2E tests
    await server.start();
  });

  afterAll(async () => {
    if (server && server.isServerRunning()) {
      await server.stop();
    }
  });

  describe('Mathematical Construction Workflows', () => {
    it('should create a complete geometric construction workflow', async () => {
      // Step 1: Check initial status
      const statusResult = await registry.executeTool('geogebra_instance_status', {});
      expect(statusResult.content[0]?.type).toBe('text');
      
      const status = JSON.parse(statusResult.content[0]?.text!);
      expect(status.success).toBe(true);

      // Step 2: Clear any existing construction
      const clearResult = await registry.executeTool('geogebra_clear_construction', {});
      expect(clearResult.content[0]?.type).toBe('text');
      
      const clearResponse = JSON.parse(clearResult.content[0]?.text!);
      expect(clearResponse.success).toBe(true);

      // Step 3: Create triangle vertices
      const pointA = await registry.executeTool('geogebra_create_point', {
        name: 'A',
        x: 0,
        y: 0
      });
      expect(JSON.parse(pointA.content[0]?.text!).success).toBe(true);

      const pointB = await registry.executeTool('geogebra_create_point', {
        name: 'B',
        x: 4,
        y: 0
      });
      expect(JSON.parse(pointB.content[0]?.text!).success).toBe(true);

      const pointC = await registry.executeTool('geogebra_create_point', {
        name: 'C',
        x: 2,
        y: 3
      });
      expect(JSON.parse(pointC.content[0]?.text!).success).toBe(true);

      // Step 4: Create triangle sides using eval command
      const lineAB = await registry.executeTool('geogebra_eval_command', {
        command: 'Segment(A, B)'
      });
      expect(JSON.parse(lineAB.content[0]?.text!).success).toBe(true);

      const lineBC = await registry.executeTool('geogebra_eval_command', {
        command: 'Segment(B, C)'
      });
      expect(JSON.parse(lineBC.content[0]?.text!).success).toBe(true);

      const lineCA = await registry.executeTool('geogebra_eval_command', {
        command: 'Segment(C, A)'
      });
      expect(JSON.parse(lineCA.content[0]?.text!).success).toBe(true);

      // Step 5: Verify objects were created
      const objectsResult = await registry.executeTool('geogebra_get_objects', {});
      const objects = JSON.parse(objectsResult.content[0]?.text!);
      
      expect(objects.objectCount).toBeGreaterThan(0);
      expect(objects.objects).toBeDefined();
      expect(Array.isArray(objects.objects)).toBe(true);

      // Step 6: Export the construction
      const exportResult = await registry.executeTool('geogebra_export_svg', {});
      const exportData = JSON.parse(exportResult.content[0]?.text!);
      
      expect(exportData.success).toBe(true);
      expect(exportData.format).toBe('SVG');
      expect(exportData.data).toBeDefined();
    });

    it('should handle function graphing workflow', async () => {
      // Clear construction
      await registry.executeTool('geogebra_clear_construction', {});

      // Create a quadratic function
      const funcResult = await registry.executeTool('geogebra_eval_command', {
        command: 'f(x) = x^2 - 2*x - 3'
      });
      expect(JSON.parse(funcResult.content[0]?.text!).success).toBe(true);

      // Find roots
      const rootsResult = await registry.executeTool('geogebra_eval_command', {
        command: 'Root(f)'
      });
      expect(JSON.parse(rootsResult.content[0]?.text!).success).toBe(true);

      // Find vertex
      const vertexResult = await registry.executeTool('geogebra_eval_command', {
        command: 'Vertex(f)'
      });
      expect(JSON.parse(vertexResult.content[0]?.text!).success).toBe(true);

      // Export as PNG
      const pngResult = await registry.executeTool('geogebra_export_png', { scale: 1 });
      const pngData = JSON.parse(pngResult.content[0]?.text!);
      
      expect(pngData.success).toBe(true);
      expect(pngData.format).toBe('PNG');
      expect(pngData.data).toBeDefined();
    });
  });

  describe('Error Recovery Workflows', () => {
    it('should handle invalid command gracefully and continue working', async () => {
      // Clear construction
      await registry.executeTool('geogebra_clear_construction', {});

      // Try invalid command
      const invalidResult = await registry.executeTool('geogebra_eval_command', {
        command: 'InvalidCommand(123)'
      });
      
      // Should not throw error, but should indicate failure
      const invalidResponse = JSON.parse(invalidResult.content[0]?.text!);
      expect(invalidResponse.success).toBe(false);

      // Verify we can still execute valid commands
      const validResult = await registry.executeTool('geogebra_create_point', {
        name: 'P',
        x: 1,
        y: 1
      });
      
      const validResponse = JSON.parse(validResult.content[0]?.text!);
      expect(validResponse.success).toBe(true);
    });

    it('should handle missing parameters gracefully', async () => {
      // Try to create point without required parameters
      await expect(registry.executeTool('geogebra_create_point', {
        name: 'P'
        // Missing x and y
      })).rejects.toThrow();

      // Verify server is still functional
      const statusResult = await registry.executeTool('geogebra_instance_status', {});
      const status = JSON.parse(statusResult.content[0]?.text!);
      expect(status.success).toBe(true);
    });
  });

  describe('Complex Mathematical Workflows', () => {
    it('should handle calculus workflow', async () => {
      // Clear construction
      await registry.executeTool('geogebra_clear_construction', {});

      // Create a function
      const funcResult = await registry.executeTool('geogebra_eval_command', {
        command: 'f(x) = sin(x) * exp(-x/2)'
      });
      expect(JSON.parse(funcResult.content[0]?.text!).success).toBe(true);

      // Create derivative
      const derivResult = await registry.executeTool('geogebra_eval_command', {
        command: 'g(x) = f\'(x)'
      });
      expect(JSON.parse(derivResult.content[0]?.text!).success).toBe(true);

      // Create integral
      const integralResult = await registry.executeTool('geogebra_eval_command', {
        command: 'Integral(f, 0, pi)'
      });
      expect(JSON.parse(integralResult.content[0]?.text!).success).toBe(true);

      // Verify all objects exist
      const objectsResult = await registry.executeTool('geogebra_get_objects', {});
      const objects = JSON.parse(objectsResult.content[0]?.text!);
      expect(objects.objectCount).toBeGreaterThan(0);
    });

    it('should handle geometry analysis workflow', async () => {
      // Clear construction
      await registry.executeTool('geogebra_clear_construction', {});

      // Create a polygon
      const polygonResult = await registry.executeTool('geogebra_eval_command', {
        command: 'poly = Polygon((0,0), (4,0), (4,3), (0,3))'
      });
      expect(JSON.parse(polygonResult.content[0]?.text!).success).toBe(true);

      // Calculate area
      const areaResult = await registry.executeTool('geogebra_eval_command', {
        command: 'area = Area(poly)'
      });
      expect(JSON.parse(areaResult.content[0]?.text!).success).toBe(true);

      // Calculate perimeter
      const perimeterResult = await registry.executeTool('geogebra_eval_command', {
        command: 'perimeter = Perimeter(poly)'
      });
      expect(JSON.parse(perimeterResult.content[0]?.text!).success).toBe(true);

      // Get all objects to verify creation
      const objectsResult = await registry.executeTool('geogebra_get_objects', {});
      const objects = JSON.parse(objectsResult.content[0]?.text!);
      expect(objects.objectCount).toBeGreaterThan(3); // polygon + area + perimeter + vertices
    });
  });

  describe('Export and Documentation Workflows', () => {
    it('should support multiple export formats in sequence', async () => {
      // Create simple construction
      await registry.executeTool('geogebra_clear_construction', {});
      await registry.executeTool('geogebra_eval_command', {
        command: 'Circle((0,0), 2)'
      });

      // Export as SVG
      const svgResult = await registry.executeTool('geogebra_export_svg', {});
      const svgData = JSON.parse(svgResult.content[0]?.text!);
      expect(svgData.success).toBe(true);
      expect(svgData.format).toBe('SVG');
      expect(svgData.data).toContain('<svg');

      // Export as PNG
      const pngResult = await registry.executeTool('geogebra_export_png', { scale: 1.5 });
      const pngData = JSON.parse(pngResult.content[0]?.text!);
      expect(pngData.success).toBe(true);
      expect(pngData.format).toBe('PNG');
      expect(pngData.scale).toBe(1.5);

      // Export as PDF
      const pdfResult = await registry.executeTool('geogebra_export_pdf', {});
      const pdfData = JSON.parse(pdfResult.content[0]?.text!);
      expect(pdfData.success).toBe(true);
      expect(pdfData.format).toBe('PDF');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple sequential operations reliably', async () => {
      // Clear and create multiple objects in sequence
      await registry.executeTool('geogebra_clear_construction', {});

      const operations: Promise<any>[] = [];
      for (let i = 0; i < 5; i++) {
        operations.push(
          registry.executeTool('geogebra_create_point', {
            name: `P${i}`,
            x: i,
            y: i * 2
          })
        );
      }

      // Wait for all operations to complete
      const results = await Promise.all(operations);
      
      // Verify all operations succeeded
      results.forEach(result => {
        const response = JSON.parse(result.content[0]?.text!);
        expect(response.success).toBe(true);
      });

      // Verify all objects were created
      const objectsResult = await registry.executeTool('geogebra_get_objects', {});
      const objects = JSON.parse(objectsResult.content[0]?.text!);
      expect(objects.objectCount).toBe(5);
    });
  });
}); 