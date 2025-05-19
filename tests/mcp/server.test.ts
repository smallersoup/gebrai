import { MCPServer } from '../../src/mcp/server';
import { InitializeParams } from '../../src/mcp/types';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('MCPServer', () => {
  let mcpServer: MCPServer;

  beforeEach(() => {
    mcpServer = new MCPServer();
  });

  describe('initialize', () => {
    it('should initialize the server with correct capabilities', async () => {
      const params: InitializeParams = {
        capabilities: {
          sampling: { supported: true },
          notifications: { supported: true },
        },
        clientInfo: {
          name: 'Test Client',
          version: '1.0.0',
        },
      };

      const result = await mcpServer.initialize(params);

      expect(result).toBeDefined();
      expect(result.capabilities).toBeDefined();
      expect(result.capabilities.resources?.supported).toBe(true);
      expect(result.capabilities.tools?.supported).toBe(true);
      expect(result.capabilities.prompts?.supported).toBe(true);
      expect(result.serverInfo?.name).toBe('GeoGebra MCP Server');
    });
  });

  describe('getTools', () => {
    it('should return an empty array when no tools are registered', async () => {
      // Initialize the server first
      await mcpServer.initialize({
        capabilities: {
          sampling: { supported: true },
          notifications: { supported: true },
        },
      });

      const tools = await mcpServer.getTools({});
      expect(tools).toEqual([]);
    });
  });

  describe('getPrompts', () => {
    it('should return an empty array when no prompts are registered', async () => {
      // Initialize the server first
      await mcpServer.initialize({
        capabilities: {
          sampling: { supported: true },
          notifications: { supported: true },
        },
      });

      const prompts = await mcpServer.getPrompts({});
      expect(prompts).toEqual([]);
    });
  });

  describe('getResources', () => {
    it('should return an empty array when no resources exist', async () => {
      // Initialize the server first
      await mcpServer.initialize({
        capabilities: {
          sampling: { supported: true },
          notifications: { supported: true },
        },
      });

      const resources = await mcpServer.getResources({});
      expect(resources).toEqual([]);
    });
  });

  describe('subscribeToResources', () => {
    it('should return a subscription ID and empty resources array', async () => {
      // Initialize the server first
      await mcpServer.initialize({
        capabilities: {
          sampling: { supported: true },
          notifications: { supported: true },
        },
      });

      const result = await mcpServer.subscribeToResources({
        resourceTypes: ['visualization/2d-graph'],
      });

      expect(result).toBeDefined();
      expect(result.subscriptionId).toBeDefined();
      expect(result.resources).toEqual([]);
    });

    it('should use the provided subscription ID if given', async () => {
      // Initialize the server first
      await mcpServer.initialize({
        capabilities: {
          sampling: { supported: true },
          notifications: { supported: true },
        },
      });

      const subscriptionId = 'test-subscription-id';
      const result = await mcpServer.subscribeToResources({
        resourceTypes: ['visualization/2d-graph'],
        subscriptionId,
      });

      expect(result.subscriptionId).toBe(subscriptionId);
    });
  });

  describe('unsubscribeFromResources', () => {
    it('should not throw an error when unsubscribing from a non-existent subscription', async () => {
      // Initialize the server first
      await mcpServer.initialize({
        capabilities: {
          sampling: { supported: true },
          notifications: { supported: true },
        },
      });

      await expect(
        mcpServer.unsubscribeFromResources({
          subscriptionId: 'non-existent-id',
        })
      ).resolves.not.toThrow();
    });
  });

  describe('shutdown', () => {
    it('should shut down the server without errors', async () => {
      // Initialize the server first
      await mcpServer.initialize({
        capabilities: {
          sampling: { supported: true },
          notifications: { supported: true },
        },
      });

      await expect(mcpServer.shutdown()).resolves.not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should throw an error when trying to get tools before initialization', async () => {
      await expect(mcpServer.getTools({})).rejects.toThrow('MCP server not initialized');
    });

    it('should throw an error when trying to get prompts before initialization', async () => {
      await expect(mcpServer.getPrompts({})).rejects.toThrow('MCP server not initialized');
    });

    it('should throw an error when trying to get resources before initialization', async () => {
      await expect(mcpServer.getResources({})).rejects.toThrow('MCP server not initialized');
    });

    it('should throw an error when trying to subscribe to resources before initialization', async () => {
      await expect(
        mcpServer.subscribeToResources({
          resourceTypes: ['visualization/2d-graph'],
        })
      ).rejects.toThrow('MCP server not initialized');
    });

    it('should throw an error when trying to unsubscribe from resources before initialization', async () => {
      await expect(
        mcpServer.unsubscribeFromResources({
          subscriptionId: 'test-id',
        })
      ).rejects.toThrow('MCP server not initialized');
    });
  });
});

