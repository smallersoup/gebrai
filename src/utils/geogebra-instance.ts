// @ts-nocheck
import puppeteer, { Browser, Page } from 'puppeteer';
import { 
  GeoGebraConfig, 
  GeoGebraAPI, 
  GeoGebraCommandResult, 
  GeoGebraObject,
  GeoGebraError,
  GeoGebraConnectionError,
  GeoGebraCommandError 
} from '../types/geogebra';
import '../types/global';
import logger from './logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * GeoGebra Instance - Manages a single GeoGebra instance via Puppeteer
 */
export class GeoGebraInstance implements GeoGebraAPI {
  private browser?: Browser | undefined;
  private page?: Page | undefined;
  private isInitialized: boolean = false;
  private lastActivity: Date = new Date();
  
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
    
    logger.info(`Created GeoGebra instance ${this.id}`, { config: this.config });
  }

  /**
   * Initialize the GeoGebra instance
   */
  async initialize(headless: boolean = true, browserArgs: string[] = []): Promise<void> {
    try {
      logger.info(`Initializing GeoGebra instance ${this.id}`, { headless });
      
      // Launch browser
      this.browser = await puppeteer.launch({
        headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          ...browserArgs
        ]
      });

      // Create new page
      this.page = await this.browser.newPage();
      
      // Set viewport
      await this.page.setViewport({
        width: this.config.width || 800,
        height: this.config.height || 600
      });

      // Load GeoGebra
      await this.loadGeoGebra();
      
      // Wait for GeoGebra to be ready
      await this.waitForReady();
      
      this.isInitialized = true;
      this.updateActivity();
      
      logger.info(`GeoGebra instance ${this.id} initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize GeoGebra instance ${this.id}`, error);
      await this.cleanup();
      throw new GeoGebraConnectionError(
        `Failed to initialize GeoGebra: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Load GeoGebra applet in the browser
   */
  private async loadGeoGebra(): Promise<void> {
    if (!this.page) {
      throw new GeoGebraConnectionError('Page not initialized');
    }

    const appletHTML = this.generateAppletHTML();
    
    await this.page.setContent(appletHTML);
    
    // Wait for GeoGebra to load
    await this.page.waitForFunction('window.ggbApplet', { timeout: 30000 });
  }

  /**
   * Generate HTML content with GeoGebra applet
   */
  private generateAppletHTML(): string {
    const config = this.config;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>GeoGebra Applet</title>
    <script src="https://www.geogebra.org/apps/deployggb.js"></script>
</head>
<body>
    <div id="ggb-element"></div>
    <script>
        const parameters = {
            "appName": "${config.appName}",
            "width": ${config.width},
            "height": ${config.height},
            "showMenuBar": ${config.showMenuBar},
            "showToolBar": ${config.showToolBar},
            "showAlgebraInput": ${config.showAlgebraInput},
            "showResetIcon": ${config.showResetIcon},
            "enableRightClick": ${config.enableRightClick},
            "enableLabelDrags": ${config.enableLabelDrags},
            "enableShiftDragZoom": ${config.enableShiftDragZoom},
            "language": "${config.language}",
            ${config.material_id ? `"material_id": "${config.material_id}",` : ''}
            ${config.filename ? `"filename": "${config.filename}",` : ''}
            ${config.ggbBase64 ? `"ggbBase64": "${config.ggbBase64}",` : ''}
            "useBrowserForJS": false,
            "preventFocus": true
        };

        window.ggbOnInit = function() {
            window.ggbReady = true;
            console.log('GeoGebra initialized');
        };

        const applet = new GGBApplet(parameters, true);
        applet.inject('ggb-element');
    </script>
</body>
</html>`;
  }

  /**
   * Wait for GeoGebra to be ready
   */
  private async waitForReady(timeout: number = 30000): Promise<void> {
    if (!this.page) {
      throw new GeoGebraConnectionError('Page not initialized');
    }

    try {
      await this.page.waitForFunction('window.ggbReady === true', { timeout });
      logger.debug(`GeoGebra instance ${this.id} is ready`);
    } catch (error) {
      throw new GeoGebraConnectionError('GeoGebra failed to initialize within timeout');
    }
  }

  /**
   * Execute a GeoGebra command
   */
  async evalCommand(command: string): Promise<GeoGebraCommandResult> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      logger.debug(`Executing command on instance ${this.id}: ${command}`);
      
      const result = await this.page!.evaluate(`
        (function(cmd) {
          try {
            const success = window.ggbApplet.evalCommand(cmd);
            return {
              success: success,
              error: success ? undefined : 'Command execution failed'
            };
          } catch (error) {
            return {
              success: false,
              error: error.message || 'Unknown error'
            };
          }
        })('${command.replace(/'/g, "\\'")}')
      `) as GeoGebraCommandResult;

      if (!result.success) {
        throw new GeoGebraCommandError(result.error || 'Command failed', command);
      }

      logger.debug(`Command executed successfully on instance ${this.id}: ${command}`);
      return result;
    } catch (error) {
      logger.error(`Command execution failed on instance ${this.id}`, { command, error });
      if (error instanceof GeoGebraCommandError) {
        throw error;
      }
      throw new GeoGebraCommandError(
        `Failed to execute command: ${error instanceof Error ? error.message : String(error)}`,
        command
      );
    }
  }

  /**
   * Execute command and get labels of created objects
   */
  async evalCommandGetLabels(command: string): Promise<string[]> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const script = [
        '(function(cmd) {',
        '  const result = window.ggbApplet.evalCommandGetLabels(cmd);',
        '  return result ? result.split(",").filter(function(label) { return label.trim(); }) : [];',
        `})('${command.replace(/'/g, "\\'")}');`
      ].join('\n');
      
      const labels = await this.page!.evaluate(script) as string[];

      logger.debug(`Command executed on instance ${this.id}, labels: ${labels.join(', ')}`);
      return labels;
    } catch (error) {
      logger.error(`Failed to execute command with labels on instance ${this.id}`, { command, error });
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
      await this.page!.evaluate(`window.ggbApplet.deleteObject('${objName.replace(/'/g, "\\'")}');`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete object ${objName} on instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Check if object exists
   */
  async exists(objName: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const exists = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.exists(name);
      }, objName);
      return exists;
    } catch (error) {
      logger.error(`Failed to check existence of object ${objName} on instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Check if object is defined
   */
  async isDefined(objName: string): Promise<boolean> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const defined = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.isDefined(name);
      }, objName);
      return defined;
    } catch (error) {
      logger.error(`Failed to check if object ${objName} is defined on instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Get all object names
   */
  async getAllObjectNames(type?: string): Promise<string[]> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const names = await this.page!.evaluate((objType) => {
        return (window as any).ggbApplet.getAllObjectNames(objType);
      }, type);
      return names || [];
    } catch (error) {
      logger.error(`Failed to get object names on instance ${this.id}`, error);
      return [];
    }
  }

  /**
   * Get object information
   */
  async getObjectInfo(objName: string): Promise<GeoGebraObject | null> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const info = await this.page!.evaluate((name) => {
        if (!(window as any).ggbApplet.exists(name)) {
          return null;
        }

        return {
          name,
          type: (window as any).ggbApplet.getObjectType(name),
          value: (window as any).ggbApplet.getValue(name),
          visible: (window as any).ggbApplet.getVisible(name),
          defined: (window as any).ggbApplet.isDefined(name),
          x: (window as any).ggbApplet.getXcoord(name),
          y: (window as any).ggbApplet.getYcoord(name),
          z: (window as any).ggbApplet.getZcoord(name),
          color: (window as any).ggbApplet.getColor(name)
        };
      }, objName);

      return info;
    } catch (error) {
      logger.error(`Failed to get object info for ${objName} on instance ${this.id}`, error);
      return null;
    }
  }

  /**
   * Get X coordinate of object
   */
  async getXcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const x = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getXcoord(name);
      }, objName);
      return x || 0;
    } catch (error) {
      logger.error(`Failed to get X coordinate of ${objName} on instance ${this.id}`, error);
      return 0;
    }
  }

  /**
   * Get Y coordinate of object
   */
  async getYcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const y = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getYcoord(name);
      }, objName);
      return y || 0;
    } catch (error) {
      logger.error(`Failed to get Y coordinate of ${objName} on instance ${this.id}`, error);
      return 0;
    }
  }

  /**
   * Get Z coordinate of object
   */
  async getZcoord(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const z = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getZcoord(name);
      }, objName);
      return z || 0;
    } catch (error) {
      logger.error(`Failed to get Z coordinate of ${objName} on instance ${this.id}`, error);
      return 0;
    }
  }

  /**
   * Get value of object
   */
  async getValue(objName: string): Promise<number> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const value = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getValue(name);
      }, objName);
      return value || 0;
    } catch (error) {
      logger.error(`Failed to get value of ${objName} on instance ${this.id}`, error);
      return 0;
    }
  }

  /**
   * Get value string of object
   */
  async getValueString(objName: string): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const valueStr = await this.page!.evaluate((name) => {
        return (window as any).ggbApplet.getValueString(name);
      }, objName);
      return valueStr || '';
    } catch (error) {
      logger.error(`Failed to get value string of ${objName} on instance ${this.id}`, error);
      return '';
    }
  }

  /**
   * Clear construction
   */
  async newConstruction(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(() => {
        (window as any).ggbApplet.newConstruction();
      });
      logger.debug(`Construction cleared on instance ${this.id}`);
    } catch (error) {
      logger.error(`Failed to clear construction on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to clear construction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Reset construction
   */
  async reset(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(() => {
        (window as any).ggbApplet.reset();
      });
      logger.debug(`Construction reset on instance ${this.id}`);
    } catch (error) {
      logger.error(`Failed to reset construction on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to reset construction: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Refresh views
   */
  async refreshViews(): Promise<void> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      await this.page!.evaluate(() => {
        (window as any).ggbApplet.refreshViews();
      });
      logger.debug(`Views refreshed on instance ${this.id}`);
    } catch (error) {
      logger.error(`Failed to refresh views on instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to refresh views: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Check if GeoGebra is ready
   */
  async isReady(): Promise<boolean> {
    if (!this.page) return false;

    try {
      const ready = await this.page.evaluate(() => {
        return (window as any).ggbReady === true && (window as any).ggbApplet;
      });
      return ready;
    } catch (error) {
      logger.error(`Failed to check ready state on instance ${this.id}`, error);
      return false;
    }
  }

  /**
   * Export construction as PNG (base64)
   */
  async exportPNG(scale: number = 1): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const pngBase64 = await this.page!.evaluate(`
        (function(scale) {
          return window.ggbApplet.getPNGBase64(scale, true, 72);
        })(${scale})
      `) as string;

      logger.debug(`PNG exported from instance ${this.id} with scale ${scale}`);
      return pngBase64;
    } catch (error) {
      logger.error(`Failed to export PNG from instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to export PNG: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export construction as SVG
   */
  async exportSVG(): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      const svg = await this.page!.evaluate(`
        (function() {
          return window.ggbApplet.exportSVG();
        })()
      `) as string;

      logger.debug(`SVG exported from instance ${this.id}`);
      return svg;
    } catch (error) {
      logger.error(`Failed to export SVG from instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to export SVG: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Export construction as PDF (base64)
   */
  async exportPDF(): Promise<string> {
    this.ensureInitialized();
    this.updateActivity();

    try {
      // Generate PDF by taking a screenshot of the page
      const pdf = await this.page!.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
          right: '0.5in'
        }
      });

      const pdfBase64 = pdf.toString('base64');
      logger.debug(`PDF exported from instance ${this.id}`);
      return pdfBase64;
    } catch (error) {
      logger.error(`Failed to export PDF from instance ${this.id}`, error);
      throw new GeoGebraError(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    logger.debug(`Cleaning up GeoGebra instance ${this.id}`);
    
    try {
      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }
    } catch (error) {
      logger.error(`Error closing page for instance ${this.id}`, error);
    }

    try {
      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      logger.error(`Error closing browser for instance ${this.id}`, error);
    }

    this.page = undefined;
    this.browser = undefined;
    this.isInitialized = false;
    
    logger.debug(`GeoGebra instance ${this.id} cleaned up successfully`);
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
      throw new GeoGebraConnectionError('GeoGebra instance not initialized');
    }
  }
} 