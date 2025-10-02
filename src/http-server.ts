import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { animationConverter } from './utils/animation-converter';
import { McpServer } from './server';
import { OptimizedInstancePool } from './utils/performance/instance-pool';
import { toolRegistry } from './tools';
import logger from './utils/logger';

/**
 * HTTP Server for GeoGebra MCP Tool
 * Provides RESTful API interface for GeoGebra operations
 */
class GeoGebraHttpServer {
  private app: express.Application;
  private server: any;
  private instancePool!: OptimizedInstancePool;
  private mcpServer!: McpServer;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.initializeServices();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // CORS for cross-origin requests
    this.app.use(cors({
      origin: process.env['CORS_ORIGIN'] || '*',
      credentials: true
    }));

    // JSON parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Request logging
    this.app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  /**
   * Save base64 data to file
   */
  private saveBase64ToFile(base64Data: string, filename: string, outputDir?: string): string {
    const dir = outputDir || process.env['EXPORT_DIR'] || './exports';
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const filePath = path.join(dir, filename);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    logger.info(`File saved: ${filePath}`);
    return filePath;
  }

  /**
   * Save text data to file
   */
  private saveTextToFile(textData: string, filename: string, outputDir?: string): string {
    const dir = outputDir || process.env['EXPORT_DIR'] || './exports';
    
    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, textData, 'utf8');
    
    logger.info(`File saved: ${filePath}`);
    return filePath;
  }

  /**
   * Generate unique filename
   */
  private generateFilename(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}.${extension}`;
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.healthCheck.bind(this));
    
    // Service status
    this.app.get('/status', this.getStatus.bind(this));
    
    // Tools list
    this.app.get('/tools', this.getTools.bind(this));
    
    // Execute tool
    this.app.post('/tools/:toolName', this.executeTool.bind(this));
    
    // GeoGebra operations
    this.app.post('/geogebra/command', this.executeCommand.bind(this));
    this.app.post('/geogebra/export/png', this.exportPNG.bind(this));
    this.app.post('/geogebra/export/svg', this.exportSVG.bind(this));
    this.app.post('/geogebra/export/pdf', this.exportPDF.bind(this));
    
    // File export endpoints
    this.app.post('/export/png', this.exportPNGFile.bind(this));
    this.app.post('/export/svg', this.exportSVGFile.bind(this));
    this.app.post('/export/pdf', this.exportPDFFile.bind(this));
    this.app.post('/export/:format', this.exportFile.bind(this));
    
    // File download endpoints
    this.app.get('/download/:filename', this.downloadFile.bind(this));
    this.app.get('/files', this.listFiles.bind(this));
    
    // Performance endpoints
    this.app.post('/warmup', this.warmupInstances.bind(this));
    this.app.get('/performance', this.getPerformance.bind(this));
    
    // Animation export endpoints
    this.app.post('/export/gif', this.exportGIF.bind(this));
    this.app.post('/export/mp4', this.exportMP4.bind(this));
    this.app.post('/export/animation/:format', this.exportAnimation.bind(this));
    
    // Instance management
    this.app.get('/instances', this.getInstances.bind(this));
    this.app.post('/instances/cleanup', this.cleanupInstances.bind(this));
    
    // Performance monitoring
    this.app.get('/performance', this.getPerformance.bind(this));
    
    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * Initialize services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize instance pool
      this.instancePool = OptimizedInstancePool.getInstance({
        maxInstances: parseInt(process.env['MAX_INSTANCES'] || '3'),
        instanceTimeout: parseInt(process.env['INSTANCE_TIMEOUT'] || '300000'),
        maxIdleTime: parseInt(process.env['MAX_IDLE_TIME'] || '600000')
      });

      // Initialize MCP server for tool registry
      this.mcpServer = new McpServer({
        name: 'GeoGebra MCP HTTP Service',
        version: '1.0.0',
        description: 'HTTP interface for GeoGebra mathematical visualization',
        logLevel: (process.env['LOG_LEVEL'] as any) || 'info'
      });

      logger.info('Services initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize services', error);
      throw error;
    }
  }

  /**
   * Health check endpoint
   */
  private async healthCheck(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          instancePool: this.instancePool ? 'running' : 'stopped',
          mcpServer: this.mcpServer ? 'running' : 'stopped'
        },
        uptime: process.uptime()
      };

      res.json(health);
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get service status
   */
  private async getStatus(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const status = {
        server: this.mcpServer.getStatus(),
        instancePool: {
          totalInstances: this.instancePool['instances']?.size || 0,
          activeInstances: this.instancePool['instances'] ? 
            Array.from(this.instancePool['instances'].values()).filter(p => p.isActive).length : 0,
          availableInstances: this.instancePool['instances'] ? 
            Array.from(this.instancePool['instances'].values()).filter(p => !p.isActive).length : 0
        },
        tools: {
          count: toolRegistry.getToolCount(),
          names: toolRegistry.getTools().map(t => t.name)
        }
      };

      res.json(status);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get available tools
   */
  private async getTools(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const tools = toolRegistry.getTools();
      res.json({ tools });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute a tool
   */
  private async executeTool(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { toolName } = req.params;
      const args = req.body;

      if (!toolName) {
        res.status(400).json({ error: 'Tool name is required' });
        return;
      }

      const result = await toolRegistry.executeTool(toolName, args);
      res.json(result);
    } catch (error) {
      logger.error('Tool execution failed', { toolName: req.params['toolName'], error });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute GeoGebra command
   */
  private async executeCommand(req: express.Request, res: express.Response): Promise<void> {
    let instance: any = null;
    try {
      const { command } = req.body;

      if (!command) {
        res.status(400).json({ error: 'Command is required' });
        return;
      }

      instance = await this.instancePool.getInstance();
      
      // Wait a bit for instance to be fully ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const result = await instance.evalCommand(command);
      
      res.json(result);
    } catch (error) {
      logger.error('Command execution failed', { command: req.body.command, error });
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      // IMPORTANT: Always release the instance back to the pool
      if (instance) {
        try {
          await this.instancePool.releaseInstance(instance);
        } catch (releaseError) {
          logger.warn('Failed to release instance:', releaseError);
        }
      }
    }
  }

  /**
   * Export as PNG (base64 only)
   */
  private async exportPNG(req: express.Request, res: express.Response): Promise<void> {
    let instance: any = null;
    try {
      const { scale = 1, transparent = false, dpi = 72, width, height } = req.body;

      instance = await this.instancePool.getInstance();
      const pngBase64 = await instance.exportPNG(scale, transparent, dpi, width, height);
      
      res.json({
        format: 'png',
        data: pngBase64,
        metadata: { scale, transparent, dpi, width, height }
      });
    } catch (error) {
      logger.error('PNG export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      if (instance) {
        try {
          await this.instancePool.releaseInstance(instance);
        } catch (releaseError) {
          logger.warn('Failed to release instance:', releaseError);
        }
      }
    }
  }

  /**
   * Export as PNG file
   */
  private async exportPNGFile(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { 
        scale = 1, 
        transparent = false, 
        dpi = 72, 
        width, 
        height,
        filename,
        outputDir
      } = req.body;

      const instance = await this.instancePool.getInstance();
      const pngBase64 = await instance.exportPNG(scale, transparent, dpi, width, height);
      
      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename('geogebra', 'png');
      
      // Save to file
      const filePath = this.saveBase64ToFile(pngBase64, finalFilename, outputDir);
      
      res.json({
        success: true,
        format: 'png',
        filename: finalFilename,
        filePath: filePath,
        metadata: { scale, transparent, dpi, width, height },
        downloadUrl: `/download/${finalFilename}`
      });
    } catch (error) {
      logger.error('PNG file export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export as SVG (text only)
   */
  private async exportSVG(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const instance = await this.instancePool.getInstance();
      const svg = await instance.exportSVG();
      
      res.json({
        format: 'svg',
        data: svg
      });
    } catch (error) {
      logger.error('SVG export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export as SVG file
   */
  private async exportSVGFile(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { filename, outputDir } = req.body;

      const instance = await this.instancePool.getInstance();
      const svg = await instance.exportSVG();
      
      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename('geogebra', 'svg');
      
      // Save to file
      const filePath = this.saveTextToFile(svg, finalFilename, outputDir);
      
      res.json({
        success: true,
        format: 'svg',
        filename: finalFilename,
        filePath: filePath,
        downloadUrl: `/download/${finalFilename}`
      });
    } catch (error) {
      logger.error('SVG file export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export as PDF (base64 only)
   */
  private async exportPDF(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const instance = await this.instancePool.getInstance();
      const pdfBase64 = await instance.exportPDF();
      
      res.json({
        format: 'pdf',
        data: pdfBase64
      });
    } catch (error) {
      logger.error('PDF export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export as PDF file
   */
  private async exportPDFFile(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { filename, outputDir } = req.body;

      const instance = await this.instancePool.getInstance();
      const pdfBase64 = await instance.exportPDF();
      
      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename('geogebra', 'pdf');
      
      // Save to file
      const filePath = this.saveBase64ToFile(pdfBase64, finalFilename, outputDir);
      
      res.json({
        success: true,
        format: 'pdf',
        filename: finalFilename,
        filePath: filePath,
        downloadUrl: `/download/${finalFilename}`
      });
    } catch (error) {
      logger.error('PDF file export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export file by format
   */
  private async exportFile(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { format } = req.params;
      const { filename, outputDir, ...options } = req.body;

      if (!format) {
        res.status(400).json({ error: 'Format parameter is required' });
        return;
      }

      const instance = await this.instancePool.getInstance();
      let result: any;

      switch (format.toLowerCase()) {
        case 'png':
          result = await instance.exportPNG(
            options.scale || 1,
            options.transparent || false,
            options.dpi || 72,
            options.width,
            options.height
          );
          break;
        case 'svg':
          result = await instance.exportSVG();
          break;
        case 'pdf':
          result = await instance.exportPDF();
          break;
        default:
          res.status(400).json({ error: `Unsupported format: ${format}` });
          return;
      }

      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename('geogebra', format);
      
      // Save to file
      let filePath: string;
      if (format.toLowerCase() === 'svg') {
        filePath = this.saveTextToFile(result, finalFilename, outputDir);
      } else {
        filePath = this.saveBase64ToFile(result, finalFilename, outputDir);
      }
      
      res.json({
        success: true,
        format: format,
        filename: finalFilename,
        filePath: filePath,
        downloadUrl: `/download/${finalFilename}`,
        metadata: options
      });
    } catch (error) {
      logger.error('File export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Download file
   */
  private async downloadFile(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        res.status(400).json({ error: 'Filename parameter is required' });
        return;
      }
      
      const dir = process.env['EXPORT_DIR'] || './exports';
      const filePath = path.join(dir, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      // Set appropriate headers
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case '.png':
          contentType = 'image/png';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.mp4':
          contentType = 'video/mp4';
          break;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Send file
      res.sendFile(path.resolve(filePath));
    } catch (error) {
      logger.error('File download failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * List exported files
   */
  private async listFiles(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const dir = process.env['EXPORT_DIR'] || './exports';
      
      if (!fs.existsSync(dir)) {
        res.json({ 
          success: true,
          files: [] 
        });
        return;
      }

      const files = fs.readdirSync(dir)
        .filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.png', '.svg', '.pdf', '.gif', '.mp4'].includes(ext);
        })
        .map(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,  // Changed from 'filename' to 'name' to match test expectation
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            downloadUrl: `/download/${file}`
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      res.json({ 
        success: true,
        files 
      });
    } catch (error) {
      logger.error('File listing failed', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get instance information
   */
  private async getInstances(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const instances = this.instancePool['instances'] ? 
        Array.from(this.instancePool['instances'].values()).map(p => ({
          id: p.instance.id,
          isActive: p.isActive,
          lastUsed: p.lastUsed,
          createdAt: p.createdAt,
          usageCount: p.usageCount
        })) : [];
      res.json({ instances });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Cleanup instances
   */
  private async cleanupInstances(_req: express.Request, res: express.Response): Promise<void> {
    try {
      await this.instancePool.cleanup();
      res.json({ message: 'Instances cleaned up successfully' });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Warm up instances for better performance
   */
  private async warmupInstances(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { count = 3 } = req.body;
      
      logger.info(`Starting instance warmup for ${count} instances`);
      
      // Use the instance pool's built-in warmup method
      await this.instancePool.warmUp(count);
      
      // Get current pool status
      const instances = this.instancePool['instances'] || new Map();
      const availableInstances = Array.from(instances.values())
        .filter(p => !p.isActive)
        .map(p => ({
          id: p.instance.id,
          status: 'ready',
          createdAt: p.createdAt,
          usageCount: p.usageCount
        }));
      
      res.json({
        success: true,
        message: `Warmed up ${count} instances`,
        totalInstances: instances.size,
        availableInstances: availableInstances.length,
        instances: availableInstances
      });
    } catch (error) {
      logger.error('Instance warmup failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Export animation as GIF
   */
  private async exportGIF(req: express.Request, res: express.Response): Promise<void> {
    let instance: any = null;
    try {
      const { 
        duration = 5000, 
        frameRate = 10, 
        quality = 80,
        width = 800, 
        height = 600,
        filename,
        outputDir
      } = req.body;

      instance = await this.instancePool.getInstance();
      
      // Export animation frames
      const frames = await instance.exportAnimation({
        duration,
        frameRate,
        format: 'frames',
        width,
        height
      });

      if (!Array.isArray(frames) || frames.length === 0) {
        throw new Error('No animation frames captured');
      }

      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename('animation', 'gif');
      
      // Get output directory
      const dir = outputDir || process.env['EXPORT_DIR'] || './exports';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const outputPath = path.join(dir, finalFilename);

      // Convert frames to GIF
      logger.debug('Calling convertToGIF with options:', {
        framesCount: frames.length,
        outputPath,
        format: 'gif',
        frameRate,
        quality,
        width,
        height
      });
      
      const gifPath = await animationConverter.convertToGIF({
        frames,
        outputPath,
        format: 'gif',
        frameRate,
        quality,
        width,
        height
      });

      const fileSize = animationConverter.getFileSize(gifPath);

      res.json({
        success: true,
        format: 'gif',
        filename: finalFilename,
        filePath: gifPath,
        downloadUrl: `/download/${finalFilename}`,
        metadata: {
          duration,
          frameRate,
          frameCount: frames.length,
          quality,
          width,
          height,
          fileSize
        }
      });
    } catch (error) {
      logger.error('GIF export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      if (instance) {
        try {
          await this.instancePool.releaseInstance(instance);
        } catch (releaseError) {
          logger.warn('Failed to release instance:', releaseError);
        }
      }
    }
  }

  /**
   * Export animation as MP4
   */
  private async exportMP4(req: express.Request, res: express.Response): Promise<void> {
    let instance: any = null;
    try {
      const { 
        duration = 5000, 
        frameRate = 30, 
        quality = 23,
        width = 800, 
        height = 600,
        filename,
        outputDir
      } = req.body;

      instance = await this.instancePool.getInstance();
      
      // Export animation frames
      const frames = await instance.exportAnimation({
        duration,
        frameRate,
        format: 'frames',
        width,
        height
      });

      if (!Array.isArray(frames) || frames.length === 0) {
        throw new Error('No animation frames captured');
      }

      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename('animation', 'mp4');
      
      // Get output directory
      const dir = outputDir || process.env['EXPORT_DIR'] || './exports';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const outputPath = path.join(dir, finalFilename);

      // Convert frames to MP4
      const mp4Path = await animationConverter.convertToMP4({
        frames,
        outputPath,
        format: 'mp4',
        frameRate,
        quality,
        width,
        height
      });

      const fileSize = animationConverter.getFileSize(mp4Path);

      res.json({
        success: true,
        format: 'mp4',
        filename: finalFilename,
        filePath: mp4Path,
        downloadUrl: `/download/${finalFilename}`,
        metadata: {
          duration,
          frameRate,
          frameCount: frames.length,
          quality,
          width,
          height,
          fileSize
        }
      });
    } catch (error) {
      logger.error('MP4 export failed', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      if (instance) {
        try {
          await this.instancePool.releaseInstance(instance);
        } catch (releaseError) {
          logger.warn('Failed to release instance:', releaseError);
        }
      }
    }
  }

  /**
   * Export animation by format
   */
  private async exportAnimation(req: express.Request, res: express.Response): Promise<void> {
    const { format } = req.params;
    
    if (format === 'gif') {
      return this.exportGIF(req, res);
    } else if (format === 'mp4') {
      return this.exportMP4(req, res);
    } else {
      res.status(400).json({ error: `Unsupported animation format: ${format}` });
    }
  }

  /**
   * Get performance metrics
   */
  private async getPerformance(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const instances = this.instancePool['instances'] || new Map();
      const stats = {
        totalInstances: instances.size,
        activeInstances: Array.from(instances.values()).filter(p => p.isActive).length,
        availableInstances: Array.from(instances.values()).filter(p => !p.isActive).length,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      };
      res.json(stats);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Error handler
   */
  private errorHandler(err: Error, req: express.Request, res: express.Response, _next: express.NextFunction): void {
    logger.error('HTTP request error', { error: err, path: req.path });
    
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          logger.info(`GeoGebra HTTP Server started on port ${this.port}`);
          logger.info(`Health check: http://localhost:${this.port}/health`);
          logger.info(`API documentation: http://localhost:${this.port}/status`);
          resolve();
        });

        // Graceful shutdown
        process.on('SIGTERM', () => this.stop());
        process.on('SIGINT', () => this.stop());
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP Server stopped');
          
          // Cleanup services
          if (this.instancePool) {
            await this.instancePool.cleanup();
          }
          
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const port = parseInt(process.env['PORT'] || '3000');
    const server = new GeoGebraHttpServer(port);
    
    await server.start();
    
    logger.info('GeoGebra HTTP Service is ready!');
    logger.info(`Server running on http://localhost:${port}`);
    
  } catch (error) {
    logger.error('Failed to start HTTP server', error);
    process.exit(1);
  }
}

// Start if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('Application startup failed', error);
    process.exit(1);
  });
}

export { GeoGebraHttpServer };
