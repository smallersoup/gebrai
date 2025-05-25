import { EventEmitter } from 'events';
import { 
  JsonRpcRequest, 
  JsonRpcResponse, 
  McpServerConfig,
  McpToolsListRequest,
  McpToolsListResponse,
  McpToolCallRequest,
  McpToolCallResponse
} from './types/mcp';
import { toolRegistry } from './tools';
import { handleError, validateJsonRpcRequest, errors } from './utils/errors';
import logger from './utils/logger';

/**
 * MCP Server implementation following JSON-RPC 2.0 protocol
 */
export class McpServer extends EventEmitter {
  private config: McpServerConfig;
  private isRunning: boolean = false;

  constructor(config: McpServerConfig) {
    super();
    this.config = config;
    logger.info('MCP Server initialized', { config });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Server is already running');
      return;
    }

    try {
      this.isRunning = true;
      logger.info(`MCP Server started: ${this.config.name} v${this.config.version}`);
      logger.info(`Available tools: ${toolRegistry.getToolCount()}`);
      
      this.emit('started');
    } catch (error) {
      this.isRunning = false;
      logger.error('Failed to start MCP server', error);
      throw error;
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Server is not running');
      return;
    }

    try {
      this.isRunning = false;
      logger.info('MCP Server stopped');
      this.emit('stopped');
    } catch (error) {
      logger.error('Error stopping MCP server', error);
      throw error;
    }
  }

  /**
   * Process a JSON-RPC request
   */
  async processRequest(requestData: unknown): Promise<JsonRpcResponse> {
    try {
      // Validate basic JSON-RPC structure
      if (!validateJsonRpcRequest(requestData)) {
        return this.createErrorResponse(null, handleError(errors.invalidRequest()));
      }

      const request = requestData as JsonRpcRequest;
      logger.debug('Processing request', { method: request.method, id: request.id });

      // Route to appropriate handler
      switch (request.method) {
        case 'tools/list':
          return await this.handleToolsList(request as McpToolsListRequest);
        
        case 'tools/call':
          return await this.handleToolsCall(request as McpToolCallRequest);
        
        default:
          return this.createErrorResponse(
            request.id ?? null,
            handleError(errors.methodNotFound(request.method))
          );
      }
    } catch (error) {
      logger.error('Error processing request', error);
      return this.createErrorResponse(null, handleError(error));
    }
  }

  /**
   * Handle tools/list requests
   */
  private async handleToolsList(request: McpToolsListRequest): Promise<McpToolsListResponse> {
    try {
      const tools = toolRegistry.getTools();
      logger.debug(`Returning ${tools.length} tools`);

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        result: {
          tools
        }
      };
    } catch (error) {
      logger.error('Error handling tools/list', error);
      return this.createToolsListErrorResponse(request.id ?? null, handleError(error));
    }
  }

  /**
   * Handle tools/call requests
   */
  private async handleToolsCall(request: McpToolCallRequest): Promise<McpToolCallResponse> {
    try {
      // Validate request parameters
      if (!request.params || typeof request.params.name !== 'string') {
        return this.createToolsCallErrorResponse(
          request.id ?? null,
          handleError(errors.invalidParams('Missing or invalid tool name'))
        );
      }

      const { name, arguments: toolArgs = {} } = request.params;
      
      // Execute the tool
      const result = await toolRegistry.executeTool(name, toolArgs);

      return {
        jsonrpc: '2.0',
        id: request.id ?? null,
        result
      };
    } catch (error) {
      logger.error('Error handling tools/call', error);
      return this.createToolsCallErrorResponse(request.id ?? null, handleError(error));
    }
  }

  /**
   * Create an error response
   */
  private createErrorResponse(id: string | number | null, error: ReturnType<typeof handleError>): JsonRpcResponse {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  /**
   * Create a tools/list error response
   */
  private createToolsListErrorResponse(id: string | number | null, error: ReturnType<typeof handleError>): McpToolsListResponse {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  /**
   * Create a tools/call error response
   */
  private createToolsCallErrorResponse(id: string | number | null, error: ReturnType<typeof handleError>): McpToolCallResponse {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      isRunning: this.isRunning,
      toolCount: toolRegistry.getToolCount(),
      uptime: this.isRunning ? process.uptime() : 0
    };
  }

  /**
   * Get server configuration
   */
  getConfig(): McpServerConfig {
    return { ...this.config };
  }

  /**
   * Check if server is running
   */
  isServerRunning(): boolean {
    return this.isRunning;
  }
} 