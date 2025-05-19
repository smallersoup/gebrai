import { v4 as uuidv4 } from 'uuid';
import NodeCache from 'node-cache';
import { logger } from '../utils/logger';
import {
  InitializeParams,
  InitializeResult,
  ServerCapabilities,
  Resource,
  GetResourcesParams,
  SubscribeParams,
  SubscriptionResult,
  UnsubscribeParams,
  Tool,
  GetToolsParams,
  ExecuteToolParams,
  ExecuteToolResult,
  Prompt,
  GetPromptsParams,
  ExecutePromptParams,
  ExecutePromptResult,
  ErrorResponse,
} from './types';
import { validateToolArguments } from './validation';
import { toolRegistry } from './tools/registry';
import { promptRegistry } from './prompts/registry';
import { createError, ErrorCode } from './handlers';

// Cache for resources and subscriptions
const resourceCache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL || '300', 10),
  checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD || '60', 10),
});

// Store for active subscriptions
const subscriptions: Record<string, SubscribeParams> = {};

/**
 * MCP Server implementation
 */
export class MCPServer {
  private initialized = false;
  private serverCapabilities: ServerCapabilities;

  constructor() {
    // Define server capabilities
    this.serverCapabilities = {
      resources: {
        supported: true,
        changeNotifications: true,
      },
      tools: {
        supported: true,
        executionNotifications: true,
      },
      prompts: {
        supported: true,
        executionNotifications: true,
      },
    };
  }

  /**
   * Initialize the MCP server
   * @param params Initialization parameters
   * @returns Initialization result
   */
  async initialize(params: InitializeParams): Promise<InitializeResult> {
    logger.info('Initializing MCP server', { clientInfo: params.clientInfo });

    // Store client capabilities for future use
    // This could be used to adapt behavior based on client capabilities
    
    // Mark as initialized
    this.initialized = true;

    // Return server capabilities and info
    return {
      capabilities: this.serverCapabilities,
      serverInfo: {
        name: 'GeoGebra MCP Server',
        version: '0.1.0',
      },
    };
  }

  /**
   * Shut down the MCP server
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down MCP server');
    
    // Clear all caches and subscriptions
    resourceCache.flushAll();
    Object.keys(subscriptions).forEach((id) => {
      delete subscriptions[id];
    });
    
    this.initialized = false;
  }

  /**
   * Get resources based on filter criteria
   * @param params Resource filter parameters
   * @returns Array of matching resources
   */
  async getResources(params: GetResourcesParams): Promise<Resource[]> {
    this.checkInitialized();
    
    logger.info('Getting resources', { params });
    
    // Get all resources from cache
    const resources: Resource[] = [];
    const keys = resourceCache.keys();
    
    for (const key of keys) {
      if (key.startsWith('resource:')) {
        const resource = resourceCache.get<Resource>(key);
        if (resource) {
          // Filter by resource type if specified
          if (params.resourceTypes && params.resourceTypes.length > 0) {
            if (params.resourceTypes.includes(resource.type)) {
              resources.push(resource);
            }
          } else {
            resources.push(resource);
          }
        }
      }
    }
    
    // Apply custom filter if provided
    if (params.filter) {
      // Implement custom filtering logic here
      // This is a placeholder for more complex filtering
    }
    
    return resources;
  }

  /**
   * Subscribe to resource changes
   * @param params Subscription parameters
   * @returns Subscription result with initial resources
   */
  async subscribeToResources(params: SubscribeParams): Promise<SubscriptionResult> {
    this.checkInitialized();
    
    logger.info('Subscribing to resources', { params });
    
    // Generate subscription ID if not provided
    const subscriptionId = params.subscriptionId || uuidv4();
    
    // Store subscription
    subscriptions[subscriptionId] = {
      ...params,
      subscriptionId,
    };
    
    // Get initial resources matching the subscription
    const resources = await this.getResources({
      resourceTypes: params.resourceTypes,
      filter: params.filter,
    });
    
    return {
      subscriptionId,
      resources,
    };
  }

  /**
   * Unsubscribe from resource changes
   * @param params Unsubscribe parameters
   */
  async unsubscribeFromResources(params: UnsubscribeParams): Promise<void> {
    this.checkInitialized();
    
    logger.info('Unsubscribing from resources', { subscriptionId: params.subscriptionId });
    
    // Remove subscription
    if (subscriptions[params.subscriptionId]) {
      delete subscriptions[params.subscriptionId];
    } else {
      throw createError(
        ErrorCode.SUBSCRIPTION_NOT_FOUND,
        `Subscription '${params.subscriptionId}' not found`
      );
    }
  }

  /**
   * Get available tools
   * @param params Tool filter parameters
   * @returns Array of available tools
   */
  async getTools(params: GetToolsParams): Promise<Tool[]> {
    this.checkInitialized();
    
    logger.info('Getting tools', { params });
    
    // Get all tools from registry
    let tools = toolRegistry.getAllTools();
    
    // Apply filter if provided
    if (params.filter) {
      // Implement custom filtering logic here
      // This is a placeholder for more complex filtering
    }
    
    return tools;
  }

  /**
   * Execute a tool with the provided arguments
   * @param params Tool execution parameters
   * @returns Tool execution result
   */
  async executeTool(params: ExecuteToolParams): Promise<ExecuteToolResult> {
    this.checkInitialized();
    
    const { toolName, arguments: args, executionId = uuidv4() } = params;
    
    logger.info('Executing tool', { toolName, executionId });
    
    try {
      // Get the tool from the registry
      const tool = toolRegistry.getTool(toolName);
      if (!tool) {
        throw createError(
          ErrorCode.TOOL_NOT_FOUND,
          `Tool '${toolName}' not found`
        );
      }
      
      // Validate arguments against the tool's input schema
      const validationResult = validateToolArguments(tool, args);
      if (!validationResult.valid) {
        throw createError(
          ErrorCode.INVALID_TOOL_ARGUMENTS,
          validationResult.error || 'Invalid arguments',
          { toolName, arguments: args }
        );
      }
      
      // Execute the tool
      const startTime = Date.now();
      const result = await tool.execute(args);
      const duration = Date.now() - startTime;
      
      logger.info('Tool execution completed', { toolName, executionId, duration });
      
      // Store any resources created by the tool
      if (result.resources) {
        for (const resource of result.resources) {
          this.storeResource(resource);
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Tool execution failed', { toolName, executionId, error });
      
      if (error instanceof Error) {
        if ('code' in error) {
          // If it's already an ErrorResponse, return it
          return {
            result: null,
            error: error as unknown as ErrorResponse,
          };
        }
        
        return {
          result: null,
          error: createError(
            ErrorCode.TOOL_EXECUTION_ERROR,
            error.message,
            { toolName, arguments: args }
          ),
        };
      }
      
      return {
        result: null,
        error: error as ErrorResponse,
      };
    }
  }

  /**
   * Get available prompts
   * @param params Prompt filter parameters
   * @returns Array of available prompts
   */
  async getPrompts(params: GetPromptsParams): Promise<Prompt[]> {
    this.checkInitialized();
    
    logger.info('Getting prompts', { params });
    
    // Get all prompts from registry
    let prompts = promptRegistry.getAllPrompts();
    
    // Apply filter if provided
    if (params.filter) {
      // Implement custom filtering logic here
      // This is a placeholder for more complex filtering
    }
    
    return prompts;
  }

  /**
   * Execute a prompt with the provided arguments
   * @param params Prompt execution parameters
   * @returns Prompt execution result
   */
  async executePrompt(params: ExecutePromptParams): Promise<ExecutePromptResult> {
    this.checkInitialized();
    
    const { promptId, arguments: args, executionId = uuidv4() } = params;
    
    logger.info('Executing prompt', { promptId, executionId });
    
    try {
      // Get the prompt from the registry
      const prompt = promptRegistry.getPrompt(promptId);
      if (!prompt) {
        throw createError(
          ErrorCode.PROMPT_NOT_FOUND,
          `Prompt '${promptId}' not found`
        );
      }
      
      // Validate arguments against the prompt's input schema
      // Implement validation logic here
      
      // Execute the prompt
      const startTime = Date.now();
      const result = await prompt.execute(args);
      const duration = Date.now() - startTime;
      
      logger.info('Prompt execution completed', { promptId, executionId, duration });
      
      // Store any resources created by the prompt
      if (result.resources) {
        for (const resource of result.resources) {
          this.storeResource(resource);
        }
      }
      
      return result;
    } catch (error) {
      logger.error('Prompt execution failed', { promptId, executionId, error });
      
      if (error instanceof Error) {
        if ('code' in error) {
          // If it's already an ErrorResponse, return it
          return {
            result: null,
            error: error as unknown as ErrorResponse,
          };
        }
        
        return {
          result: null,
          error: createError(
            ErrorCode.PROMPT_EXECUTION_ERROR,
            error.message,
            { promptId, arguments: args }
          ),
        };
      }
      
      return {
        result: null,
        error: error as ErrorResponse,
      };
    }
  }

  /**
   * Store a resource in the cache and notify subscribers
   * @param resource The resource to store
   */
  storeResource(resource: Resource): void {
    // Add timestamp if not present
    if (!resource.metadata) {
      resource.metadata = {};
    }
    if (!resource.metadata.timestamp) {
      resource.metadata.timestamp = new Date().toISOString();
    }
    
    // Store in cache
    resourceCache.set(`resource:${resource.id}`, resource);
    
    // Notify subscribers
    this.notifyResourceChange('created', resource);
  }

  /**
   * Update a resource in the cache and notify subscribers
   * @param resource The resource to update
   */
  updateResource(resource: Resource): void {
    // Update timestamp
    if (!resource.metadata) {
      resource.metadata = {};
    }
    resource.metadata.timestamp = new Date().toISOString();
    
    // Update in cache
    resourceCache.set(`resource:${resource.id}`, resource);
    
    // Notify subscribers
    this.notifyResourceChange('updated', resource);
  }

  /**
   * Delete a resource from the cache and notify subscribers
   * @param resourceId The ID of the resource to delete
   */
  deleteResource(resourceId: string): void {
    // Get the resource before deleting
    const resource = resourceCache.get<Resource>(`resource:${resourceId}`);
    if (!resource) {
      return;
    }
    
    // Delete from cache
    resourceCache.del(`resource:${resourceId}`);
    
    // Notify subscribers
    this.notifyResourceChange('deleted', resource);
  }

  /**
   * Notify subscribers of a resource change
   * @param changeType The type of change
   * @param resource The resource that changed
   */
  private notifyResourceChange(
    changeType: 'created' | 'updated' | 'deleted',
    resource: Resource
  ): void {
    // Find subscriptions that match this resource
    Object.entries(subscriptions).forEach(([subscriptionId, subscription]) => {
      // Check if the subscription includes this resource type
      if (subscription.resourceTypes.includes(resource.type)) {
        // Check custom filter if present
        if (subscription.filter) {
          // Implement custom filtering logic here
          // This is a placeholder for more complex filtering
        }
        
        // Emit notification (implementation depends on the notification mechanism)
        logger.debug('Resource change notification', {
          subscriptionId,
          changeType,
          resourceId: resource.id,
          resourceType: resource.type,
        });
        
        // In a real implementation, this would send the notification to the client
        // For example, using SSE or WebSockets
      }
    });
  }

  /**
   * Check if the server is initialized
   * @throws Error if the server is not initialized
   */
  private checkInitialized(): void {
    if (!this.initialized) {
      throw createError(ErrorCode.SERVER_NOT_INITIALIZED, 'MCP server not initialized');
    }
  }
}

// Create and export a singleton instance
export const mcpServer = new MCPServer();
