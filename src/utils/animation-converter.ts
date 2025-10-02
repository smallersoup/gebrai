/**
 * Animation Converter Utility
 * Converts GeoGebra animation frames to GIF and MP4 formats
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import logger from './logger';

const execAsync = promisify(exec);

export interface AnimationConversionOptions {
  frames: string[]; // Base64 encoded PNG frames
  outputPath: string;
  format: 'gif' | 'mp4';
  frameRate?: number;
  quality?: number;
  width?: number;
  height?: number;
}

export class AnimationConverter {
  private tempDir: string;

  constructor(tempDir: string = './temp-animation') {
    this.tempDir = tempDir;
    this.ensureTempDir();
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Convert animation frames to GIF
   */
  async convertToGIF(options: AnimationConversionOptions): Promise<string> {
    const { frames, outputPath, frameRate = 10, quality = 80 } = options;
    
    logger.debug(`convertToGIF called with format: ${options.format}`);
    
    if (options.format !== 'gif') {
      throw new Error(`Unsupported format: ${options.format}`);
    }
    
    logger.info(`Converting ${frames.length} frames to GIF: ${outputPath}`);

    try {
      // Save frames as temporary PNG files
      const frameFiles = await this.saveFramesAsFiles(frames);
      
      // Use FFmpeg to create GIF
      const gifPath = await this.createGifWithFFmpeg(frameFiles, outputPath, frameRate, quality);
      
      // Cleanup temporary files
      await this.cleanupTempFiles(frameFiles);
      
      logger.info(`GIF created successfully: ${gifPath}`);
      return gifPath;
    } catch (error) {
      logger.error('GIF conversion failed:', error);
      throw new Error(`GIF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert animation frames to MP4
   */
  async convertToMP4(options: AnimationConversionOptions): Promise<string> {
    const { frames, outputPath, frameRate = 30, quality = 23, width, height } = options;
    
    if (options.format !== 'mp4') {
      throw new Error(`Unsupported format: ${options.format}`);
    }
    
    logger.info(`Converting ${frames.length} frames to MP4: ${outputPath}`);

    try {
      // Save frames as temporary PNG files
      const frameFiles = await this.saveFramesAsFiles(frames);
      
      // Use FFmpeg to create MP4 with optional size adjustment
      const mp4Path = await this.createMp4WithFFmpeg(frameFiles, outputPath, frameRate, quality, width, height);
      
      // Cleanup temporary files
      await this.cleanupTempFiles(frameFiles);
      
      logger.info(`MP4 created successfully: ${mp4Path}`);
      return mp4Path;
    } catch (error) {
      logger.error('MP4 conversion failed:', error);
      throw new Error(`MP4 conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save base64 frames as temporary PNG files
   */
  private async saveFramesAsFiles(frames: string[]): Promise<string[]> {
    const frameFiles: string[] = [];
    
    // Ensure temp directory exists before saving frames
    this.ensureTempDir();
    
    for (let i = 0; i < frames.length; i++) {
      const frameData = frames[i];
      if (!frameData) {
        logger.warn(`Frame ${i} is empty, skipping`);
        continue;
      }
      
      const framePath = path.join(this.tempDir, `frame_${String(i).padStart(4, '0')}.png`);
      
      try {
        // Remove data URL prefix if present
        const base64Data = frameData.replace(/^data:image\/png;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        fs.writeFileSync(framePath, buffer);
        frameFiles.push(framePath);
        logger.debug(`Saved frame ${i} to ${framePath}`);
      } catch (error) {
        logger.error(`Failed to save frame ${i}:`, error);
        throw error;
      }
    }
    
    logger.debug(`Saved ${frameFiles.length} frames to temporary files in ${this.tempDir}`);
    return frameFiles;
  }

  /**
   * Create GIF using FFmpeg
   */
  private async createGifWithFFmpeg(
    _frameFiles: string[], 
    outputPath: string, 
    frameRate: number, 
    _quality: number
  ): Promise<string> {
    const inputPattern = path.join(this.tempDir, 'frame_%04d.png');
    const palettePath = path.join(this.tempDir, 'palette.png');
    
    // Create palette for better GIF quality
    const paletteCommand = `ffmpeg -y -i "${inputPattern}" -vf "palettegen" "${palettePath}"`;
    logger.debug(`Creating palette: ${paletteCommand}`);
    await execAsync(paletteCommand);
    
    // Create GIF with palette
    const gifCommand = `ffmpeg -y -framerate ${frameRate} -i "${inputPattern}" -i "${palettePath}" -lavfi "paletteuse" -loop 0 "${outputPath}"`;
    logger.debug(`Creating GIF: ${gifCommand}`);
    await execAsync(gifCommand);
    
    return outputPath;
  }

  /**
   * Create MP4 using FFmpeg
   * Automatically adjusts dimensions to be divisible by 2 for H.264 encoding
   */
  private async createMp4WithFFmpeg(
    _frameFiles: string[], 
    outputPath: string, 
    frameRate: number, 
    quality: number,
    targetWidth?: number,
    targetHeight?: number
  ): Promise<string> {
    const inputPattern = path.join(this.tempDir, 'frame_%04d.png');
    
    // Build FFmpeg command with scale filter to ensure even dimensions
    let scaleFilter = '';
    if (targetWidth && targetHeight) {
      // Ensure both dimensions are even by rounding down to nearest even number
      const evenWidth = Math.floor(targetWidth / 2) * 2;
      const evenHeight = Math.floor(targetHeight / 2) * 2;
      scaleFilter = `-vf "scale=${evenWidth}:${evenHeight}" `;
    } else {
      // Auto-scale to ensure even dimensions without changing aspect ratio
      scaleFilter = `-vf "scale='if(gt(iw,ih),trunc(iw/2)*2,trunc(ih*dar/2)*2)':'if(gt(iw,ih),trunc(ih/2)*2,trunc(iw/dar/2)*2)'" `;
    }
    
    // Create MP4 with H.264 encoding and dimension adjustment
    const mp4Command = `ffmpeg -y -framerate ${frameRate} -i "${inputPattern}" ${scaleFilter}-c:v libx264 -pix_fmt yuv420p -crf ${quality} -movflags +faststart "${outputPath}"`;
    logger.debug(`Creating MP4: ${mp4Command}`);
    await execAsync(mp4Command);
    
    return outputPath;
  }

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(frameFiles: string[]): Promise<void> {
    try {
      for (const file of frameFiles) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
        }
      }
      
      // Also cleanup palette file if it exists
      const palettePath = path.join(this.tempDir, 'palette.png');
      if (fs.existsSync(palettePath)) {
        fs.unlinkSync(palettePath);
      }
      
      logger.debug('Cleaned up temporary animation files');
    } catch (error) {
      logger.warn('Failed to cleanup temporary files:', error);
    }
  }

  /**
   * Get file size in bytes
   */
  getFileSize(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Check if FFmpeg is available
   */
  async checkFFmpegAvailability(): Promise<boolean> {
    try {
      await execAsync('ffmpeg -version');
      return true;
    } catch (error) {
      logger.warn('FFmpeg not available:', error);
      return false;
    }
  }
}

// Export singleton instance
export const animationConverter = new AnimationConverter();
