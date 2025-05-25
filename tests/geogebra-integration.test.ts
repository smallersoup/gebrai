import { toolRegistry } from '../src/tools';

describe('GeoGebra Integration Tests', () => {
  beforeAll(() => {
    // Set a longer timeout for browser operations
    jest.setTimeout(60000);
  });

  test('should have GeoGebra tools registered', () => {
    const tools = toolRegistry.getTools();
    const geogebraToolNames = tools
      .filter(tool => tool.name.startsWith('geogebra_'))
      .map(tool => tool.name);

    expect(geogebraToolNames).toContain('geogebra_eval_command');
    expect(geogebraToolNames).toContain('geogebra_create_point');
    expect(geogebraToolNames).toContain('geogebra_create_line');
    expect(geogebraToolNames).toContain('geogebra_get_objects');
    expect(geogebraToolNames).toContain('geogebra_clear_construction');
    expect(geogebraToolNames).toContain('geogebra_instance_status');
    expect(geogebraToolNames).toContain('geogebra_export_png');
    expect(geogebraToolNames).toContain('geogebra_export_svg');
    expect(geogebraToolNames).toContain('geogebra_export_pdf');
  });

  test('should execute geogebra_instance_status tool', async () => {
    const result = await toolRegistry.executeTool('geogebra_instance_status', {});
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0]?.type).toBe('text');
    
    const response = JSON.parse(result.content[0]?.text!);
    expect(response.success).toBeDefined();
  });

  test('should execute geogebra_eval_command tool', async () => {
    const result = await toolRegistry.executeTool('geogebra_eval_command', {
      command: 'A = (1, 2)'
    });
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0]?.type).toBe('text');
    
    const response = JSON.parse(result.content[0]?.text!);
    expect(response.command).toBe('A = (1, 2)');
  });

  test('should execute geogebra_create_point tool', async () => {
    const result = await toolRegistry.executeTool('geogebra_create_point', {
      name: 'B',
      x: 3,
      y: 4
    });
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0]?.type).toBe('text');
    
    const response = JSON.parse(result.content[0]?.text!);
    expect(response.command).toBe('B = (3, 4)');
  });

  test('should execute geogebra_get_objects tool', async () => {
    const result = await toolRegistry.executeTool('geogebra_get_objects', {});
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0]?.type).toBe('text');
    
    const response = JSON.parse(result.content[0]?.text!);
    expect(response.objectCount).toBeDefined();
    expect(response.objects).toBeDefined();
    expect(Array.isArray(response.objects)).toBe(true);
  });

  test('should execute geogebra_export_png tool', async () => {
    const result = await toolRegistry.executeTool('geogebra_export_png', { scale: 1.5 });
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0]?.type).toBe('text');
    
    const response = JSON.parse(result.content[0]?.text!);
    expect(response.success).toBe(true);
    expect(response.format).toBe('PNG');
    expect(response.scale).toBe(1.5);
    expect(response.data).toBeDefined();
    expect(response.encoding).toBe('base64');
  });

  test('should execute geogebra_export_svg tool', async () => {
    const result = await toolRegistry.executeTool('geogebra_export_svg', {});
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0]?.type).toBe('text');
    
    const response = JSON.parse(result.content[0]?.text!);
    expect(response.success).toBe(true);
    expect(response.format).toBe('SVG');
    expect(response.data).toBeDefined();
    expect(response.encoding).toBe('utf8');
    expect(response.data).toContain('<svg');
  });

  test('should execute geogebra_export_pdf tool', async () => {
    const result = await toolRegistry.executeTool('geogebra_export_pdf', {});
    
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0]).toBeDefined();
    expect(result.content[0]?.type).toBe('text');
    
    const response = JSON.parse(result.content[0]?.text!);
    expect(response.success).toBe(true);
    expect(response.format).toBe('PDF');
    expect(response.data).toBeDefined();
    expect(response.encoding).toBe('base64');
  });
}); 