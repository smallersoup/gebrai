# Data Flow Documentation: MCP-GeoGebra Integration

This document details the data flow between the Model Context Protocol (MCP) and GeoGebra in the integrated system. It covers the main interaction patterns, data transformations, and communication sequences.

## 1. Core Data Flow Patterns

### 1.1 Visualization Creation Flow

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant SL as Service Layer
    participant GA as GeoGebra Adapter
    participant GG as GeoGebra API
    participant SM as State Manager
    participant RL as Renderer
    
    AI->>MCP: create_graph(function="x^2", xRange=[-5,5], title="Parabola")
    MCP->>SL: translateRequest(create_graph, params)
    SL->>SM: createSession(sessionId)
    SM-->>SL: sessionCreated(sessionId)
    SL->>GA: createVisualization(function, range, title)
    GA->>GG: evalCommand("f(x)=x^2")
    GG-->>GA: commandResult(success)
    GA->>GG: setAxesRange(-5, 5)
    GG-->>GA: rangeSet(success)
    GA->>RL: renderVisualization(applet)
    RL-->>GA: renderingComplete(imageUrl)
    GA-->>SL: visualizationCreated(visualizationId, imageUrl)
    SL->>SM: saveState(sessionId, visualizationState)
    SM-->>SL: stateSaved(success)
    SL-->>MCP: visualizationResult(visualizationId, imageUrl)
    MCP-->>AI: {content: [{type: "image", url: imageUrl}, {type: "text", text: "Graph created successfully"}]}
```

### 1.2 Object Manipulation Flow

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant SL as Service Layer
    participant SM as State Manager
    participant GA as GeoGebra Adapter
    participant GG as GeoGebra API
    participant RL as Renderer
    
    AI->>MCP: add_point(sessionId="abc123", coordinates=[2,3], label="A")
    MCP->>SL: translateRequest(add_point, params)
    SL->>SM: getSession(sessionId)
    SM-->>SL: sessionState(visualizationState)
    SL->>GA: loadVisualization(visualizationState)
    GA->>GG: evalCommand("A=(2,3)")
    GG-->>GA: commandResult(success)
    GA->>RL: updateVisualization(applet)
    RL-->>GA: updateComplete(imageUrl)
    GA-->>SL: objectAdded(objectId, imageUrl)
    SL->>SM: updateState(sessionId, updatedState)
    SM-->>SL: stateUpdated(success)
    SL-->>MCP: objectResult(objectId, imageUrl)
    MCP-->>AI: {content: [{type: "image", url: imageUrl}, {type: "text", text: "Point A added at (2,3)"}]}
```

### 1.3 Calculation Flow

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant SL as Service Layer
    participant SM as State Manager
    participant GA as GeoGebra Adapter
    participant GG as GeoGebra API
    participant RL as Renderer
    
    AI->>MCP: calculate_derivative(sessionId="abc123", function="x^3", variable="x")
    MCP->>SL: translateRequest(calculate_derivative, params)
    SL->>SM: getSession(sessionId)
    SM-->>SL: sessionState(visualizationState)
    SL->>GA: loadVisualization(visualizationState)
    GA->>GG: evalCommandCAS("Derivative(x^3, x)")
    GG-->>GA: commandResult("3*x^2")
    GA->>GG: evalCommand("g(x)=3*x^2")
    GG-->>GA: commandResult(success)
    GA->>RL: updateVisualization(applet)
    RL-->>GA: updateComplete(imageUrl)
    GA-->>SL: calculationComplete(result, imageUrl)
    SL->>SM: updateState(sessionId, updatedState)
    SM-->>SL: stateUpdated(success)
    SL-->>MCP: calculationResult(result, imageUrl)
    MCP-->>AI: {content: [{type: "image", url: imageUrl}, {type: "text", text: "The derivative of f(x)=x^3 is g(x)=3x^2"}]}
```

## 2. Data Transformations

### 2.1 MCP Tool Parameters to GeoGebra Commands

| MCP Tool | Parameters | GeoGebra Command | Notes |
|----------|------------|------------------|-------|
| `create_graph` | `function`, `xRange`, `yRange` | `f(x)=<function>` + `setAxesRange()` | Creates a function graph with specified ranges |
| `create_3d_graph` | `function`, `xRange`, `yRange`, `zRange` | `f(x,y)=<function>` + `setAxesRange3D()` | Creates a 3D function graph |
| `add_point` | `coordinates`, `label` | `<label>=(<x>,<y>)` | Adds a labeled point at specified coordinates |
| `add_line` | `point1`, `point2`, `label` | `<label>=Line(<point1>,<point2>)` | Creates a line through two points |
| `calculate_derivative` | `function`, `variable` | `Derivative(<function>, <variable>)` | Calculates derivative using CAS |
| `solve_equation` | `equation`, `variable` | `Solve(<equation>, <variable>)` | Solves equation using CAS |

### 2.2 GeoGebra State Serialization

The state of a GeoGebra visualization is serialized in the following format:

```json
{
  "sessionId": "abc123",
  "appletType": "graphing",
  "objects": [
    {
      "id": "f",
      "type": "function",
      "definition": "f(x)=x^2",
      "color": "#1E88E5",
      "visible": true
    },
    {
      "id": "A",
      "type": "point",
      "coordinates": [2, 3],
      "color": "#D81B60",
      "visible": true
    }
  ],
  "view": {
    "xMin": -5,
    "xMax": 5,
    "yMin": -5,
    "yMax": 5,
    "gridVisible": true
  },
  "timestamp": "2025-05-19T15:30:00Z"
}
```

## 3. Error Propagation

### 3.1 Error Flow Example

```mermaid
sequenceDiagram
    participant AI as AI Assistant
    participant MCP as MCP Server
    participant SL as Service Layer
    participant GA as GeoGebra Adapter
    participant GG as GeoGebra API
    
    AI->>MCP: create_graph(function="1/x", xRange=[-1,1])
    MCP->>SL: translateRequest(create_graph, params)
    SL->>GA: createVisualization(function, range)
    GA->>GG: evalCommand("f(x)=1/x")
    GG-->>GA: commandResult(success)
    Note over GA,GG: GeoGebra creates the function but has a discontinuity at x=0
    GA->>SL: visualizationCreatedWithWarning(discontinuityWarning)
    SL-->>MCP: visualizationResult(imageUrl, warnings)
    MCP-->>AI: {content: [{type: "image", url: imageUrl}, {type: "text", text: "Graph created with warning: Function has a discontinuity at x=0"}]}
```

### 3.2 Common Error Scenarios and Responses

| Error Scenario | Detection Point | Response Strategy | MCP Response Example |
|----------------|-----------------|-------------------|----------------------|
| Invalid mathematical expression | Service Layer | Return syntax error with suggestion | `{isError: true, content: [{type: "text", text: "Invalid expression: x^@. Did you mean x^2?"}]}` |
| Division by zero | GeoGebra API | Return domain error with visualization of valid parts | `{isError: false, content: [{type: "image", url: imageUrl}, {type: "text", text: "Note: Function has a discontinuity at x=0"}]}` |
| Session not found | State Manager | Return session error with recreation suggestion | `{isError: true, content: [{type: "text", text: "Session expired. Please create a new visualization."}]}` |
| Resource limit exceeded | Service Layer | Return resource error with simplification suggestion | `{isError: true, content: [{type: "text", text: "Visualization too complex. Try simplifying or breaking into parts."}]}` |

## 4. Session Management

### 4.1 Session Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: create_visualization
    Created --> Active: first_operation
    Active --> Active: perform_operation
    Active --> Saved: save_state
    Saved --> Active: load_state
    Active --> Inactive: timeout
    Inactive --> [*]: cleanup
    Active --> [*]: explicit_close
    Saved --> [*]: expiration
```

### 4.2 Session Data Structure

```json
{
  "sessionId": "abc123",
  "userId": "user456",
  "conversationId": "conv789",
  "createdAt": "2025-05-19T15:00:00Z",
  "lastAccessedAt": "2025-05-19T15:30:00Z",
  "expiresAt": "2025-05-19T16:00:00Z",
  "visualizationState": {
    // GeoGebra state as described in section 2.2
  },
  "visualizationUrl": "https://example.com/vis/abc123.png",
  "interactiveUrl": "https://example.com/interactive/abc123"
}
```

## 5. Data Security Considerations

### 5.1 Data Transmission

- All MCP communication uses HTTPS for data in transit protection
- Authentication tokens are used to validate session access
- Sensitive parameters are validated and sanitized before processing

### 5.2 Data Storage

- Session data is encrypted at rest
- Session IDs are cryptographically secure random values
- Automatic expiration and cleanup of inactive sessions
- No personally identifiable information stored in visualization state

### 5.3 Access Control

- Session access restricted to originating conversation/user
- Resource limits enforced per user/session
- Rate limiting applied to prevent abuse
- Validation of all input parameters against schemas

## 6. Performance Optimization

### 6.1 Data Caching Strategy

- Rendered visualizations cached with appropriate cache keys
- Common mathematical operations results cached
- Session state cached in memory with database backup
- Static GeoGebra resources served from CDN

### 6.2 Payload Optimization

- Visualization images optimized for size/quality balance
- Incremental state updates rather than full state transfer
- Compression used for larger state objects
- Lazy loading of GeoGebra components

This data flow documentation provides a comprehensive view of how data moves between MCP and GeoGebra, including transformations, error handling, and optimization strategies. It serves as a guide for implementing the integration while ensuring robust data management.

