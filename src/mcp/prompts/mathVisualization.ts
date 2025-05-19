import { v4 as uuidv4 } from 'uuid';
import { Prompt, ExecutePromptResult, Resource } from '../types';
import { logger } from '../../utils/logger';

/**
 * Prompt for creating mathematical visualizations
 */
export const mathVisualizationPrompt: Prompt = {
  id: 'mathVisualization',
  title: 'Create a Mathematical Visualization',
  description: 'Create a visualization for a mathematical concept or problem',
  
  // Input schema (JSON Schema)
  inputSchema: {
    type: 'object',
    required: ['concept'],
    properties: {
      concept: {
        type: 'string',
        description: 'Mathematical concept to visualize (e.g., "quadratic function", "pythagorean theorem")',
      },
      complexity: {
        type: 'string',
        enum: ['basic', 'intermediate', 'advanced'],
        description: 'Complexity level of the visualization',
        default: 'intermediate',
      },
      format: {
        type: 'string',
        enum: ['2d', '3d', 'interactive'],
        description: 'Format of the visualization',
        default: '2d',
      },
      context: {
        type: 'string',
        description: 'Additional context or specific aspects to focus on',
      },
    },
  },
  
  // Execute the prompt
  execute: async (args: any): Promise<ExecutePromptResult> => {
    try {
      logger.info('Executing mathVisualization prompt', { args });
      
      // Extract arguments
      const {
        concept,
        complexity = 'intermediate',
        format = '2d',
        context,
      } = args;
      
      // In a real implementation, this would analyze the concept and create
      // appropriate visualizations using the GeoGebra adapter
      // For now, we'll create a mock result
      
      // Generate a unique ID for the visualization
      const visualizationId = uuidv4();
      
      // Create a mock visualization resource
      const visualizationResource: Resource = {
        id: visualizationId,
        type: `visualization/${format}`,
        data: {
          concept,
          complexity,
          format,
          // In a real implementation, this would include data for rendering
        },
        metadata: {
          title: `Visualization of ${concept}`,
          description: context ? `${concept} with focus on ${context}` : concept,
          timestamp: new Date().toISOString(),
        },
      };
      
      // Create a mock explanation resource
      const explanationId = uuidv4();
      const explanationResource: Resource = {
        id: explanationId,
        type: 'explanation',
        data: {
          concept,
          explanation: `This is a ${complexity} level explanation of ${concept}.`,
          steps: [
            'Step 1: Introduction to the concept',
            'Step 2: Key properties and formulas',
            'Step 3: Visual representation and interpretation',
          ],
        },
        metadata: {
          title: `Explanation of ${concept}`,
          timestamp: new Date().toISOString(),
        },
      };
      
      // Return the result
      return {
        result: {
          visualizationId,
          explanationId,
          message: `Created a ${complexity} level ${format} visualization of ${concept}`,
        },
        resources: [visualizationResource, explanationResource],
      };
    } catch (error) {
      logger.error('Error in mathVisualization prompt', { error });
      
      if (error instanceof Error) {
        return {
          result: null,
          error: {
            code: 'PROMPT_EXECUTION_ERROR',
            message: error.message,
            recovery: {
              recoverable: false,
              retryable: false,
            },
          },
        };
      }
      
      return {
        result: null,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unknown error occurred',
          recovery: {
            recoverable: false,
            retryable: false,
          },
        },
      };
    }
  },
};

