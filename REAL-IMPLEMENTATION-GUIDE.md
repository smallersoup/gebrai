# Real GeoGebra Implementation Guide

This guide explains how to switch from the mock implementation to the real browser-based GeoGebra implementation.

## Current Status

- ✅ **Mock Implementation**: Fully working, used for testing and development
- ✅ **Real Implementation**: Ready and compiling, requires browser environment
- ✅ **Export Capabilities**: Both implementations support PNG, SVG, PDF export

## Switching to Real Implementation

### 1. Update Import in `src/tools/geogebra-tools.ts`

**Current (Mock):**
```typescript
import { MockGeoGebraInstance } from '../utils/geogebra-mock';
// import { GeoGebraInstance } from '../utils/geogebra-instance'; // Real implementation
```

**Switch to Real:**
```typescript
// import { MockGeoGebraInstance } from '../utils/geogebra-mock'; // Mock implementation
import { GeoGebraInstance } from '../utils/geogebra-instance'; // Real implementation
```

### 2. Update Class References

**Change these types:**
```typescript
// Change these:
private instances: Map<string, MockGeoGebraInstance> = new Map();
private defaultInstance: MockGeoGebraInstance | undefined;
async getDefaultInstance(): Promise<MockGeoGebraInstance> {
  this.defaultInstance = new MockGeoGebraInstance({

// To these:
private instances: Map<string, GeoGebraInstance> = new Map();
private defaultInstance: GeoGebraInstance | undefined;
async getDefaultInstance(): Promise<GeoGebraInstance> {
  this.defaultInstance = new GeoGebraInstance({
```

### 3. Update Initialization Call

**Change:**
```typescript
await this.defaultInstance.initialize(); // Mock version
```

**To:**
```typescript
await this.defaultInstance.initialize(true); // Real version (headless = true)
```

## Real Implementation Features

### Browser-Based Execution
- Uses Puppeteer to control a headless Chrome browser
- Loads actual GeoGebra applets from geogebra.org
- Executes real GeoGebra commands through the official API

### Export Capabilities
- **PNG**: High-quality raster images using GeoGebra's native export
- **SVG**: Vector graphics with full mathematical precision
- **PDF**: Professional documents via Puppeteer's PDF generation

### Performance Considerations
- **Startup Time**: ~3-5 seconds (browser launch + GeoGebra load)
- **Memory Usage**: ~50-100MB per instance (browser overhead)
- **Command Execution**: ~100-500ms (network + rendering)

## Environment Requirements

### System Dependencies
```bash
# Install Puppeteer dependencies (Linux)
sudo apt-get install -y libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 libxss1 libxrandr2 libasound2 libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0

# macOS and Windows usually work out of the box
```

### Configuration Options
```typescript
const config: GeoGebraConfig = {
  appName: 'graphing',     // GeoGebra app type
  width: 800,              // Canvas width
  height: 600,             // Canvas height
  showMenuBar: false,      // Hide UI elements
  showToolBar: false,
  showAlgebraInput: false,
  language: 'en'           // Interface language
};
```

## Testing the Real Implementation

### 1. Basic Test
```typescript
// Create a simple test
const instance = new GeoGebraInstance();
await instance.initialize(true); // headless

// Test command execution
const result = await instance.evalCommand('A = (1, 2)');
console.log(result); // Should show success

// Test export
const png = await instance.exportPNG(2); // 2x scale
console.log('PNG size:', png.length); // Base64 string length

await instance.cleanup();
```

### 2. Performance Test
```bash
# Run with real implementation
npm test

# Monitor resource usage
top -p $(pgrep node)
```

## Troubleshooting

### Common Issues

**1. Browser Launch Fails**
- Install missing system dependencies
- Check available memory (>512MB recommended)
- Verify network access to geogebra.org

**2. GeoGebra Load Timeout**
- Increase timeout in `waitForReady()` method
- Check internet connection
- Verify firewall settings

**3. Command Execution Errors**
- Ensure GeoGebra syntax is correct
- Check object dependencies (points exist before creating lines)
- Verify instance is ready before commands

### Debug Mode
```typescript
// Enable debug logging
const instance = new GeoGebraInstance();
await instance.initialize(false); // headless = false for visual debugging
```

## Production Deployment

### Docker Configuration
```dockerfile
# Dockerfile additions for real implementation
RUN apt-get update && apt-get install -y \
    libx11-xcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxi6 libxtst6 libnss3 \
    libcups2 libxss1 libxrandr2 libasound2 \
    libpangocairo-1.0-0 libatk1.0-0 \
    libcairo-gobject2 libgtk-3-0 libgdk-pixbuf2.0-0

# Set Chrome sandbox args
ENV PUPPETEER_ARGS="--no-sandbox --disable-setuid-sandbox"
```

### Resource Limits
```yaml
# docker-compose.yml
services:
  geogebra-mcp:
    memory: 512m        # Minimum for browser
    shm_size: 128m      # Shared memory for rendering
    environment:
      - NODE_ENV=production
```

## Performance Optimization

### Instance Pooling
- Reuse browser instances across multiple requests
- Implement connection pooling for high-load scenarios
- Monitor memory usage and implement cleanup strategies

### Export Optimization
- Cache frequently requested exports
- Use appropriate scale factors for PNG exports
- Consider SVG for mathematical precision, PNG for presentations

## Migration Checklist

- [ ] Update imports in `geogebra-tools.ts`
- [ ] Change type declarations
- [ ] Update initialization calls
- [ ] Test basic functionality
- [ ] Verify export capabilities
- [ ] Update deployment configuration
- [ ] Monitor performance and resource usage
- [ ] Update documentation

## Next Steps

After switching to the real implementation:

1. **Add More Geometric Tools**: Circles, polygons, functions
2. **Advanced Features**: Animations, transformations, macros
3. **CAS Integration**: Computer Algebra System capabilities
4. **Educational Tools**: Templates, assessments, interactive lessons

The real implementation provides the full power of GeoGebra's mathematical engine while maintaining the same MCP tool interface. 