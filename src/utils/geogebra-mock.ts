import { 
  GeoGebraConfig, 
  GeoGebraAPI, 
  GeoGebraCommandResult, 
  GeoGebraObject,
  GeoGebraConnectionError,
  GeoGebraCommandError 
} from '../types/geogebra';
import logger from './logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mock GeoGebra Instance for demonstration and testing
 * This provides the same interface as the full implementation
 * but uses in-memory simulation instead of a real browser instance
 */
export class MockGeoGebraInstance implements GeoGebraAPI {
  private isInitialized: boolean = false;
  private lastActivity: Date = new Date();
  private objects: Map<string, GeoGebraObject> = new Map();
  
  public readonly id: string;
  public readonly config: GeoGebraConfig;

  constructor(config: GeoGebraConfig = {}) {
    this.id = uuidv4();
    this.config = {
      appName: 'graphing',
      width: 800,
      height: 600,
      showMenuBar: false,
      showToolBar: false,
      showAlgebraInput: false,
      showResetIcon: false,
      enableRightClick: true,
      language: 'en',
      ...config
    };
    
    logger.info(`Created Mock GeoGebra instance ${this.id}`, { config: this.config });
  }

  /**
   * Initialize the mock instance
   */
  async initialize(): Promise<void> {
    try {
      logger.info(`Initializing Mock GeoGebra instance ${this.id}`);
      
      // Simulate initialization delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.isInitialized = true;
      this.updateActivity();
      
      logger.info(`Mock GeoGebra instance ${this.id} initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize Mock GeoGebra instance ${this.id}`, error);
      throw new GeoGebraConnectionError(
        `Failed to initialize GeoGebra: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Execute a GeoGebra command (mock implementation)
   */
  async evalCommand(command: string): Promise<GeoGebraCommandResult> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      logger.debug(`Executing mock command on instance ${this.id}: ${command}`);
      
      // Parse basic commands
      const result = this.parseCommand(command);
      
      logger.debug(`Mock command executed successfully on instance ${this.id}: ${command}`);
      return {
        success: true,
        result: result
      };
    } catch (error) {
      logger.error(`Mock command execution failed on instance ${this.id}`, { command, error });
      throw new GeoGebraCommandError(
        `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`,
        command
      );
    }
  }

  /**
   * Parse and execute basic GeoGebra commands
   */
  private parseCommand(command: string): string {
    const trimmed = command.trim();
    
    // Point creation: A = (x, y)
    const pointMatch = trimmed.match(/^([A-Za-z]\w*)\s*=\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/);
    if (pointMatch && pointMatch[1] && pointMatch[2] && pointMatch[3]) {
      const [, name, x, y] = pointMatch;
      this.objects.set(name, {
        name,
        type: 'point',
        visible: true,
        defined: true,
        x: parseFloat(x),
        y: parseFloat(y),
        z: 0,
        color: '#0000FF'
      });
      return `Point ${name} created at (${x}, ${y})`;
    }

    // Line creation: l = Line(A, B)
    const lineMatch = trimmed.match(/^([A-Za-z]\w*)\s*=\s*Line\s*\(\s*([A-Za-z]\w*)\s*,\s*([A-Za-z]\w*)\s*\)$/);
    if (lineMatch && lineMatch[1] && lineMatch[2] && lineMatch[3]) {
      const [, name, point1, point2] = lineMatch;
      
      if (!this.objects.has(point1) || !this.objects.has(point2)) {
        throw new Error(`Points ${point1} or ${point2} do not exist`);
      }
      
      this.objects.set(name, {
        name,
        type: 'line',
        visible: true,
        defined: true,
        color: '#000000'
      });
      return `Line ${name} created through points ${point1} and ${point2}`;
    }

    // Function creation: f(x) = expression
    const functionMatch = trimmed.match(/^([A-Za-z]\w*)\s*\(\s*x\s*\)\s*=\s*(.+)$/);
    if (functionMatch && functionMatch[1] && functionMatch[2]) {
      const [, name, expression] = functionMatch;
      this.objects.set(name, {
        name,
        type: 'function',
        visible: true,
        defined: true,
        value: expression,
        color: '#FF0000'
      });
      return `Function ${name}(x) = ${expression} created`;
    }

    // Circle creation: Circle((x, y), r)
    const circleMatch = trimmed.match(/^Circle\s*\(\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*,\s*(\d+(?:\.\d+)?)\s*\)$/);
    if (circleMatch && circleMatch[1] && circleMatch[2] && circleMatch[3]) {
      const [, x, y, r] = circleMatch;
      const name = `circle_${Date.now()}`;
      this.objects.set(name, {
        name,
        type: 'circle',
        visible: true,
        defined: true,
        x: parseFloat(x),
        y: parseFloat(y),
        value: parseFloat(r),
        color: '#00FF00'
      });
      return `Circle created at (${x}, ${y}) with radius ${r}`;
    }

    // Generic command (just acknowledge)
    return `Command executed: ${command}`;
  }

  /**
   * Execute command and get labels of created objects
   */
  async evalCommandGetLabels(command: string): Promise<string[]> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const beforeObjects = new Set(this.objects.keys());
      await this.evalCommand(command);
      const afterObjects = new Set(this.objects.keys());
      
      const newLabels = Array.from(afterObjects).filter(label => !beforeObjects.has(label));
      
      logger.debug(`Mock command executed on instance ${this.id}, labels: ${newLabels.join(', ')}`);
      return newLabels;
    } catch (error) {
      logger.error(`Failed to execute mock command with labels on instance ${this.id}`, { command, error });
      throw new GeoGebraCommandError(
        `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`,
        command
      );
    }
  }

  /**
   * Delete an object
   */
  async deleteObject(objName: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const deleted = this.objects.delete(objName);
      if (deleted) {
        logger.debug(`Deleted object ${objName} from mock instance ${this.id}`);
      }
      return deleted;
    } catch (error) {
      logger.error(`Failed to delete object ${objName} on mock instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Check if object exists
   */
  async exists(objName: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();
    return this.objects.has(objName);
  }

  /**
   * Check if object is defined
   */
  async isDefined(objName: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();
    const obj = this.objects.get(objName);
    return obj ? obj.defined : false;
  }

  /**
   * Get all object names
   */
  async getAllObjectNames(type?: string): Promise<string[]> {
    this.ensureInitialized();
    this.updateActivity();

    if (type) {
      return Array.from(this.objects.values())
        .filter(obj => obj.type === type)
        .map(obj => obj.name);
    }
    
    return Array.from(this.objects.keys());
  }

  /**
   * Get object information
   */
  async getObjectInfo(objName: string): Promise<GeoGebraObject | null> {
    this.ensureInitialized();
    this.updateActivity();
    return this.objects.get(objName) || null;
  }

  /**
   * Get X coordinate of object
   */
  async getXcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();
    const obj = this.objects.get(objName);
    return obj?.x || 0;
  }

  /**
   * Get Y coordinate of object
   */
  async getYcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();
    const obj = this.objects.get(objName);
    return obj?.y || 0;
  }

  /**
   * Get Z coordinate of object
   */
  async getZcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();
    const obj = this.objects.get(objName);
    return obj?.z || 0;
  }

  /**
   * Get value of object
   */
  async getValue(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();
    const obj = this.objects.get(objName);
    return typeof obj?.value === 'number' ? obj.value : 0;
  }

  /**
   * Get value as string
   */
  async getValueString(objName: string): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();
    const obj = this.objects.get(objName);
    return obj?.value?.toString() || '';
  }

  /**
   * Create new construction
   */
  async newConstruction(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();
    this.objects.clear();
    logger.debug(`New construction created on mock instance ${this.id}`);
  }

  /**
   * Reset to initial state
   */
  async reset(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();
    this.objects.clear();
    logger.debug(`Mock instance ${this.id} reset to initial state`);
  }

  /**
   * Refresh all views
   */
  async refreshViews(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();
    logger.debug(`Views refreshed on mock instance ${this.id}`);
  }

  /**
   * Check if instance is ready
   */
  async isReady(): Promise<boolean> {
    return this.isInitialized;
  }

  /**
   * Export construction as PNG (base64) - Mock implementation
   */
  async exportPNG(scale: number = 1): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    // Return a simple base64 encoded placeholder PNG
    const placeholderPNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    logger.debug(`Mock PNG exported from instance ${this.id} with scale ${scale}`);
    return placeholderPNG;
  }

  /**
   * Export construction as SVG - Mock implementation
   */
  async exportSVG(): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    // Return a simple SVG with mock construction
    const mockSVG = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="white"/>
  <text x="400" y="300" text-anchor="middle" font-family="Arial" font-size="20">Mock GeoGebra Construction</text>
  ${Array.from(this.objects.values()).map(obj => {
    if (obj.type === 'point') {
      return `<circle cx="${(obj.x || 0) * 50 + 400}" cy="${(obj.y || 0) * -50 + 300}" r="3" fill="${obj.color || '#0000FF'}"/>`;
    }
    return '';
  }).join('\n  ')}
</svg>`;
    
    logger.debug(`Mock SVG exported from instance ${this.id}`);
    return mockSVG.trim();
  }

  /**
   * Export construction as PDF (base64) - Mock implementation
   */
  async exportPDF(): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    // Return a simple base64 encoded placeholder PDF
    const placeholderPDF = 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUl0KL0NvdW50IDEKPD4KZW5kb2JqCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQovQ29udGVudHMgNCAwIFIKPj4KZW5kb2JqCjQgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjEwMCAzMDAgVGQKKE1vY2sgR2VvR2VicmEgUERGKSBUagpFVApxbnN0cmVhbQplbmRvYmoKNSAwIG9iago8PAovVHlwZSAvRm9udAovU3VidHlwZSAvVHlwZTEKL0Jhc2VGb250IC9IZWx2ZXRpY2EKPj4KZW5kb2JqCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKMDAwMDAwMDIwNiAwMDAwMCBuIAowMDAwMDAwMzAxIDAwMDAwIG4gCnRyYWlsZXIKPDwKL1NpemUgNgovUm9vdCAxIDAgUgo+PgpzdGFydHhyZWYKMzk5CiUlRU9G';
    
    logger.debug(`Mock PDF exported from instance ${this.id}`);
    return placeholderPDF;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    logger.info(`Cleaning up Mock GeoGebra instance ${this.id}`);
    this.objects.clear();
    this.isInitialized = false;
    logger.info(`Mock GeoGebra instance ${this.id} cleaned up successfully`);
  }

  /**
   * Get instance state
   */
  getState() {
    return {
      id: this.id,
      isReady: this.isInitialized,
      lastActivity: this.lastActivity,
      config: this.config
    };
  }

  /**
   * Update last activity timestamp
   */
  private updateActivity(): void {
    this.lastActivity = new Date();
  }

  /**
   * Ensure instance is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new GeoGebraConnectionError('Mock GeoGebra instance not initialized');
    }
  }
} 