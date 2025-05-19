import { Prompt } from '../types';
import { logger } from '../../utils/logger';

/**
 * Registry for MCP prompts
 */
class PromptRegistry {
  private prompts: Map<string, Prompt> = new Map();

  /**
   * Register a prompt
   * @param prompt The prompt to register
   */
  registerPrompt(prompt: Prompt): void {
    if (this.prompts.has(prompt.id)) {
      logger.warn(`Prompt '${prompt.id}' already registered, overwriting`);
    }
    
    this.prompts.set(prompt.id, prompt);
    logger.info(`Registered prompt: ${prompt.id}`);
  }

  /**
   * Get a prompt by ID
   * @param id The ID of the prompt
   * @returns The prompt, or undefined if not found
   */
  getPrompt(id: string): Prompt | undefined {
    return this.prompts.get(id);
  }

  /**
   * Get all registered prompts
   * @returns Array of all prompts
   */
  getAllPrompts(): Prompt[] {
    return Array.from(this.prompts.values());
  }

  /**
   * Unregister a prompt
   * @param id The ID of the prompt to unregister
   * @returns True if the prompt was unregistered, false if it wasn't registered
   */
  unregisterPrompt(id: string): boolean {
    const result = this.prompts.delete(id);
    if (result) {
      logger.info(`Unregistered prompt: ${id}`);
    }
    return result;
  }

  /**
   * Clear all registered prompts
   */
  clearPrompts(): void {
    this.prompts.clear();
    logger.info('Cleared all prompts');
  }
}

// Create and export a singleton instance
export const promptRegistry = new PromptRegistry();

