# MCP-GeoGebra Integration: Data Flow Documentation

This document details the data flow between the Model Context Protocol (MCP) and GeoGebra integration components, providing a comprehensive view of how information moves through the system during various operations.

## 1. Request-Response Cycles

### 1.1 Basic Visualization Request

```mermaid
sequenceDiagram
    participant User
    participant AI as AI Assistant
    participant MCP as MCP Client
    participant Server as MCP Server
    participant Adapter as GeoGebra Adapter
    participant GeoAPI as GeoGebra API
    participant Viz as Visualization Engine

    User->>AI: Ask math question
    AI->>MCP: Request visualization
    MCP->>Server: Execute tool request
    Server->>Adapter: Transform request
    Adapter->>GeoAPI: Call GeoGebra methods
    GeoAPI->>Viz: Generate visualization
    Viz->>GeoAPI: Return visualization data
    GeoAPI->>Adapter: Return API response
    Adapter->>Server: Format as MCP resource
    Server->>MCP: Return tool result
    MCP->>AI: Provide visualization
    AI->>User: Present answer with visualization
```

### 1.2 Interactive Visualization Flow

```mermaid
sequenceDiagram
    participant User
    participant UI as UI Handler
    participant Viz as Visualization Engine
    participant Adapter as GeoGebra Adapter
    participant Server as MCP Server
    participant MCP as MCP Client
    participant AI as AI Assistant

    User->>UI: Manipulate visualization
    UI->>Viz: Update parameters
    Viz->>Adapter: State change notification
    Adapter->>Server: Resource update
    Server->>MCP: Publish resource change
    MCP->>AI: Notify of interaction
    AI->>User: Respond to interaction
    Viz->>UI: Render updated visualization
    UI->>User: Display updated visualization
```

### 1.3 Error Handling Flow

```mermaid
sequenceDiagram
    participant User
    participant AI as AI Assistant
    participant MCP as MCP Client
    participant Server as MCP Server
    participant Error as Error Handler
    participant Adapter as GeoGebra Adapter
    participant GeoAPI as GeoGebra API

    User->>AI: Ask complex question
    AI->>MCP: Request visualization
    MCP->>Server: Execute tool request
    Server->>Adapter: Transform request
    Adapter->>GeoAPI: Call GeoGebra methods
    GeoAPI-->>Adapter: Return error
    Adapter->>Error: Report error
    Error->>Adapter: Provide recovery strategy
    Adapter->>Server: Return error with context
    Server->>MCP: Return error response
    MCP->>AI: Provide error information
    AI->>User: Explain error and alternatives
```

## 2. Data Transformations

### 2.1 MCP Tool Request to GeoGebra API Call

| MCP Tool Request | Transformation | GeoGebra API Call |
|------------------|----------------|-------------------|
| `createGraph2D({ expression: "y=x^2", xRange: [-10, 10], yRange: [-10, 10] })` | Parse expression, set coordinate system | `evalCommand("f(x)=x^2")` + `setCoordSystem(-10, 10, -10, 10)` |
| `solveEquation({ equation: "x^2+2x-3=0", variable: "x" })` | Format as CAS command | `evalCommandCAS("Solve[x^2+2x-3=0, x]")` |
| `calculateDerivative({ function: "x^3+2x", variable: "x", order: 1 })` | Format as derivative command | `evalCommandCAS("Derivative[x^3+2x, x]")` |
| `createGeometricConstruction({ commands: ["A=(1,2)", "B=(4,5)", "Line[A,B]"] })` | Execute sequence of commands | Multiple `evalCommand()` calls in sequence |

### 2.2 GeoGebra Output to MCP Resource

| GeoGebra Output | Transformation | MCP Resource |
|-----------------|----------------|--------------|
| Graph object | Capture as image, extract data points | `{ type: "visualization", format: "image/png", data: "base64...", interactiveUrl: "...", dataPoints: [...] }` |
| CAS result | Format result, generate visualization | `{ type: "result", format: "text/plain", value: "x = 1 or x = -3", visualization: { ... } }` |
| Geometric construction | Capture as interactive scene | `{ type: "interactive", format: "application/geogebra", data: "...", objects: [...], commands: [...] }` |
| Error | Format with context and recovery options | `{ type: "error", code: "MATH_ERROR_001", message: "...", recoverable: true, alternatives: [...] }` |

## 3. State Management

### 3.1 Visualization State

The visualization state is maintained as a JSON object that includes:

```json
{
  "id": "viz-12345",
  "type": "2d-graph",
  "expressions": [
    { "id": "f1", "value": "y=x^2", "color": "#FF0000", "visible": true },
    { "id": "f2", "value": "y=2x+1", "color": "#0000FF", "visible": true }
  ],
  "view": {
    "xMin": -10,
    "xMax": 10,
    "yMin": -10,
    "yMax": 10,
    "xScale": 1,
    "yScale": 1
  },
  "objects": [
    { "id": "A", "type": "point", "coordinates": [2, 4], "visible": true },
    { "id": "B", "type": "point", "coordinates": [5, 7], "visible": true },
    { "id": "l1", "type": "line", "definition": "Line[A,B]", "visible": true }
  ],
  "settings": {
    "grid": true,
    "axes": true,
    "labels": true
  },
  "interactionMode": "pan"
}
```

### 3.2 Session State

The session state tracks the ongoing interaction between the user, AI, and visualization:

```json
{
  "sessionId": "session-67890",
  "userId": "user-12345",
  "createdAt": "2025-05-19T10:30:00Z",
  "lastActivity": "2025-05-19T10:35:22Z",
  "visualizations": [
    { "id": "viz-12345", "type": "2d-graph", "active": true },
    { "id": "viz-12346", "type": "3d-surface", "active": false }
  ],
  "history": [
    {
      "timestamp": "2025-05-19T10:30:15Z",
      "action": "create_visualization",
      "parameters": { "expression": "y=x^2" }
    },
    {
      "timestamp": "2025-05-19T10:32:30Z",
      "action": "modify_visualization",
      "parameters": { "expression": "y=x^2+1" }
    }
  ],
  "permissions": {
    "allowInteraction": true,
    "allowExport": true,
    "allowSharing": false
  }
}
```

## 4. Resource Subscription Flow

```mermaid
sequenceDiagram
    participant MCP as MCP Client
    participant Server as MCP Server
    participant Adapter as GeoGebra Adapter
    participant GeoAPI as GeoGebra API
    participant Viz as Visualization Engine

    MCP->>Server: Subscribe to visualization
    Server->>Adapter: Register subscription
    Adapter->>GeoAPI: Add update listeners
    GeoAPI->>Viz: Monitor state changes
    
    Note over Viz: Visualization changes
    
    Viz->>GeoAPI: State change event
    GeoAPI->>Adapter: Notify of change
    Adapter->>Server: Resource update notification
    Server->>MCP: Publish resource change
```

## 5. Error Categories and Handling

| Error Category | Example | Handling Strategy |
|----------------|---------|-------------------|
| **Invalid Expression** | `y=x/0` | - Detect division by zero<br>- Return specific error code<br>- Suggest alternative expression |
| **Rendering Limitation** | Complex 3D surface with too many points | - Detect performance issue<br>- Simplify visualization<br>- Notify of simplification |
| **Unsupported Operation** | Attempt to solve non-algebraic equation | - Identify operation type<br>- Return capability error<br>- Suggest numerical approximation |
| **Resource Limitation** | Too many objects in construction | - Monitor resource usage<br>- Enforce limits<br>- Suggest splitting into multiple visualizations |
| **Connection Failure** | GeoGebra API unavailable | - Implement timeout<br>- Retry with backoff<br>- Fall back to simplified visualization |

## 6. Security Flow

### 6.1 Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Client as MCP Client
    participant Auth as Auth Service
    participant Server as MCP Server
    participant GeoAdapter as GeoGebra Adapter
    
    User->>Client: Provide credentials
    Client->>Auth: Authenticate user
    Auth->>Client: Issue JWT token
    Client->>Server: Connect with token
    Server->>Auth: Validate token
    Auth->>Server: Confirm validity
    Server->>GeoAdapter: Establish session
    GeoAdapter->>Server: Session established
    Server->>Client: Connection accepted
```

### 6.2 Authorization Flow

```mermaid
sequenceDiagram
    participant Client as MCP Client
    participant Server as MCP Server
    participant Auth as Auth Service
    participant GeoAdapter as GeoGebra Adapter
    
    Client->>Server: Request operation
    Server->>Auth: Check permissions
    Auth->>Server: Return permission status
    
    alt Authorized
        Server->>GeoAdapter: Execute operation
        GeoAdapter->>Server: Return result
        Server->>Client: Return success response
    else Unauthorized
        Server->>Client: Return permission denied
    end
```

## 7. Conclusion

This data flow documentation provides a detailed view of how information moves through the MCP-GeoGebra integration system. By understanding these flows, developers can implement the system with a clear understanding of component interactions, state management, and error handling strategies.

The sequence diagrams illustrate the temporal relationships between components, while the data transformation tables show how information is converted between different formats. The state management section provides templates for maintaining consistent system state, and the error handling section outlines strategies for graceful failure recovery.

