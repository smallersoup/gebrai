import { Tool } from '../types';
import { logger } from '../../utils/logger';

/**
 * Registry for MCP tools
 */
class ToolRegistry {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register a tool
   * @param tool The tool to register
   */
  registerTool(tool: Tool): void {
    if (this.tools.has(tool.name)) {
      logger.warn(`Tool '${tool.name}' already registered, overwriting`);
    }
    
    this.tools.set(tool.name, tool);
    logger.info(`Registered tool: ${tool.name}`);
  }

  /**
   * Get a tool by name
   * @param name The name of the tool
   * @returns The tool, or undefined if not found
   */
  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   * @returns Array of all tools
   */
  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Unregister a tool
   * @param name The name of the tool to unregister
   * @returns True if the tool was unregistered, false if it wasn't registered
   */
  unregisterTool(name: string): boolean {
    const result = this.tools.delete(name);
    if (result) {
      logger.info(`Unregistered tool: ${name}`);
    }
    return result;
  }

  /**
   * Clear all registered tools
   */
  clearTools(): void {
    this.tools.clear();
    logger.info('Cleared all tools');
  }
}

// Create and export a singleton instance
export const toolRegistry = new ToolRegistry();

