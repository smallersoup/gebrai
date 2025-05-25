import { McpServer } from '../src/server';
import { McpServerConfig } from '../src/types/mcp';

describe('McpServer', () => {
  let server: McpServer;
  let config: McpServerConfig;

  beforeEach(() => {
    config = {
      name: 'Test MCP Server',
      version: '1.0.0',
      description: 'Test server for unit tests',
      logLevel: 'error'
    };
    server = new McpServer(config);
  });

  afterEach(async () => {
    if (server.isServerRunning()) {
      await server.stop();
    }
  });

  test('should initialize with correct config', () => {
    expect(server.getConfig()).toEqual(config);
    expect(server.isServerRunning()).toBe(false);
  });

  test('should start and stop successfully', async () => {
    await server.start();
    expect(server.isServerRunning()).toBe(true);

    await server.stop();
    expect(server.isServerRunning()).toBe(false);
  });

  test('should handle tools/list request', async () => {
    await server.start();
    
    const request = {
      jsonrpc: '2.0' as const,
      method: 'tools/list',
      id: 1
    };

    const response = await server.processRequest(request);

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(1);
    expect(response.result).toBeDefined();
  });

  test('should handle tools/call request', async () => {
    await server.start();
    
    const request = {
      jsonrpc: '2.0' as const,
      method: 'tools/call',
      params: {
        name: 'ping'
      },
      id: 2
    };

    const response = await server.processRequest(request);

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(2);
    expect(response.result).toBeDefined();
  });
}); 