# GeoGebra Integration Documentation

## Overview

The GeoGebra MCP Tool provides a bridge between AI models and GeoGebra's mathematical software suite through the Model Context Protocol (MCP). This integration allows AI assistants to create, manipulate, and analyze mathematical constructions programmatically.

## Implementation Details

### Architecture

The integration uses a **headless browser approach** with Puppeteer to control GeoGebra instances:

1. **GeoGebraInstance**: Manages individual GeoGebra instances via Puppeteer
2. **GeoGebraInstancePool**: Handles instance lifecycle and resource management
3. **MCP Tools**: Expose GeoGebra functionality through standardized MCP tools

### Core Components

#### GeoGebraInstance Class
- Manages a single GeoGebra instance in a headless browser
- Provides the complete GeoGebra Apps API interface
- Handles initialization, command execution, and cleanup

#### Instance Pool Management
- Maintains a default instance for tool operations
- Handles resource cleanup on process exit
- Provides efficient instance reuse

## Available Tools

### 1. geogebra_eval_command
Execute any GeoGebra command directly.

**Parameters:**
- `command` (string): The GeoGebra command to execute

**Example:**
```json
{
  "command": "f(x) = x^2 + 2*x + 1"
}
```

### 2. geogebra_create_point
Create a point with specified coordinates.

**Parameters:**
- `name` (string): Name of the point
- `x` (number): X coordinate
- `y` (number): Y coordinate

**Example:**
```json
{
  "name": "A",
  "x": 2,
  "y": 3
}
```

### 3. geogebra_create_line
Create a line through two existing points.

**Parameters:**
- `name` (string): Name of the line
- `point1` (string): Name of the first point
- `point2` (string): Name of the second point

**Example:**
```json
{
  "name": "l1",
  "point1": "A",
  "point2": "B"
}
```

### 4. geogebra_get_objects
Retrieve all objects in the current construction.

**Parameters:**
- `type` (string, optional): Filter by object type

**Example:**
```json
{
  "type": "point"
}
```

### 5. geogebra_clear_construction
Clear all objects from the construction.

**Parameters:** None

### 6. geogebra_instance_status
Get the current status of the GeoGebra instance.

**Parameters:** None

## Usage Examples

### Creating Basic Geometric Objects

```javascript
// Create points
await toolRegistry.executeTool('geogebra_create_point', {
  name: 'A',
  x: 0,
  y: 0
});

await toolRegistry.executeTool('geogebra_create_point', {
  name: 'B',
  x: 3,
  y: 4
});

// Create a line through the points
await toolRegistry.executeTool('geogebra_create_line', {
  name: 'AB',
  point1: 'A',
  point2: 'B'
});

// Get all objects
const result = await toolRegistry.executeTool('geogebra_get_objects', {});
```

### Advanced Mathematical Operations

```javascript
// Create a function
await toolRegistry.executeTool('geogebra_eval_command', {
  command: 'f(x) = sin(x)'
});

// Create a circle
await toolRegistry.executeTool('geogebra_eval_command', {
  command: 'Circle((0,0), 5)'
});

// Create a parabola
await toolRegistry.executeTool('geogebra_eval_command', {
  command: 'y = x^2'
});
```

## Technical Requirements

### Dependencies
- **puppeteer**: For headless browser automation
- **uuid**: For instance identification
- **winston**: For logging

### System Requirements
- Node.js 18+
- Chrome/Chromium browser (installed automatically by Puppeteer)
- Sufficient memory for browser instances

### Configuration

The GeoGebra instances are configured with:
- **App Type**: Graphing Calculator (default)
- **Dimensions**: 800x600 pixels
- **UI Elements**: Minimal (no menu bar, toolbar, or algebra input)
- **Language**: English
- **Headless Mode**: Enabled for server environments

## Error Handling

The integration includes comprehensive error handling:

1. **Connection Errors**: When GeoGebra fails to initialize
2. **Command Errors**: When GeoGebra commands are invalid
3. **Timeout Errors**: When operations take too long
4. **Resource Cleanup**: Automatic cleanup on process exit

## Performance Considerations

- **Instance Reuse**: A single default instance is reused for all operations
- **Lazy Initialization**: Instances are created only when needed
- **Resource Management**: Automatic cleanup prevents memory leaks
- **Timeout Handling**: Operations have reasonable timeout limits

## Limitations

1. **Browser Dependency**: Requires a browser environment
2. **Memory Usage**: Each instance consumes browser memory
3. **Network Dependency**: Requires internet access to load GeoGebra
4. **Command Language**: Commands must be in English

## Future Enhancements

1. **Instance Pooling**: Multiple instances for concurrent operations
2. **Offline Mode**: Local GeoGebra installation support
3. **Export Capabilities**: Image and file export functionality
4. **Advanced Visualization**: 3D graphics and animations
5. **Collaborative Features**: Multi-user constructions

## Troubleshooting

### Common Issues

1. **Puppeteer Installation**: Ensure Chrome/Chromium is available
2. **Memory Issues**: Monitor browser memory usage
3. **Network Connectivity**: Verify access to geogebra.org
4. **Command Syntax**: Use proper GeoGebra command syntax

### Debug Mode

Enable debug logging to troubleshoot issues:

```javascript
// Set log level to debug
process.env.LOG_LEVEL = 'debug';
```

## Testing

Run the integration tests:

```bash
npm test tests/geogebra-integration.test.ts
```

The tests verify:
- Tool registration
- Basic command execution
- Object creation and retrieval
- Error handling 