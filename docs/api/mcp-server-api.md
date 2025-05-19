# MCP Server API Documentation

This document provides detailed information about the MCP (Model Context Protocol) Server API endpoints, request/response formats, and usage examples.

## Base URL

All API endpoints are relative to the base URL:

```
http://localhost:3000/mcp
```

## Authentication

Authentication is not implemented in the current version. Future versions will support authentication via API keys or OAuth tokens.

## API Endpoints

### Server Lifecycle

#### Initialize Server

Initializes the MCP server with client capabilities.

- **URL**: `/initialize`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "capabilities": {
      "sampling": {
        "supported": true
      },
      "notifications": {
        "supported": true
      }
    },
    "clientInfo": {
      "name": "Example Client",
      "version": "1.0.0"
    },
    "locale": "en-US"
  }
  ```
- **Response**:
  ```json
  {
    "capabilities": {
      "resources": {
        "supported": true,
        "changeNotifications": true
      },
      "tools": {
        "supported": true,
        "executionNotifications": true
      },
      "prompts": {
        "supported": true,
        "executionNotifications": true
      }
    },
    "serverInfo": {
      "name": "GeoGebra MCP Server",
      "version": "0.1.0"
    }
  }
  ```

#### Shutdown Server

Shuts down the MCP server.

- **URL**: `/shutdown`
- **Method**: `POST`
- **Request Body**: Empty object `{}`
- **Response**:
  ```json
  {
    "success": true
  }
  ```

### Resource Management

#### Get Resources

Retrieves resources based on filter criteria.

- **URL**: `/resources`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "resourceTypes": ["visualization/2d-graph", "visualization/3d-graph"],
    "filter": {
      "metadata.title": "Example Visualization"
    }
  }
  ```
- **Response**:
  ```json
  [
    {
      "id": "resource-123",
      "type": "visualization/2d-graph",
      "data": {
        "expression": "y=x^2",
        "xRange": [-10, 10],
        "yRange": [-10, 100],
        "dataPoints": [
          { "x": -10, "y": 100 },
          { "x": -9, "y": 81 },
          // ... more data points
          { "x": 10, "y": 100 }
        ]
      },
      "metadata": {
        "title": "Parabola",
        "timestamp": "2025-05-19T15:30:00Z"
      }
    }
  ]
  ```

#### Subscribe to Resources

Subscribes to resource changes for specified resource types.

- **URL**: `/resources/subscribe`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "resourceTypes": ["visualization/2d-graph"],
    "filter": {
      "metadata.title": "Example Visualization"
    },
    "subscriptionId": "optional-custom-id"
  }
  ```
- **Response**:
  ```json
  {
    "subscriptionId": "subscription-123",
    "resources": [
      {
        "id": "resource-123",
        "type": "visualization/2d-graph",
        "data": {
          "expression": "y=x^2",
          "xRange": [-10, 10],
          "yRange": [-10, 100]
        },
        "metadata": {
          "title": "Parabola",
          "timestamp": "2025-05-19T15:30:00Z"
        }
      }
    ]
  }
  ```

#### Unsubscribe from Resources

Unsubscribes from resource changes.

- **URL**: `/resources/unsubscribe`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "subscriptionId": "subscription-123"
  }
  ```
- **Response**:
  ```json
  {
    "success": true
  }
  ```

### Tool Management

#### Get Tools

Retrieves available tools.

- **URL**: `/tools`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "filter": {
      "name": "createGraph"
    }
  }
  ```
- **Response**:
  ```json
  [
    {
      "name": "createGraph2D",
      "description": "Create a 2D graph visualization from a mathematical expression",
      "inputSchema": {
        "type": "object",
        "required": ["expression"],
        "properties": {
          "expression": {
            "type": "string",
            "description": "Mathematical expression to graph (e.g., \"y=x^2\")"
          },
          "xRange": {
            "type": "array",
            "items": {
              "type": "number"
            },
            "minItems": 2,
            "maxItems": 2,
            "description": "X-axis range [min, max]",
            "default": [-10, 10]
          },
          // ... more properties
        }
      },
      "outputSchema": {
        "type": "object",
        "properties": {
          "visualizationId": {
            "type": "string",
            "description": "ID of the created visualization"
          },
          // ... more properties
        }
      }
    }
  ]
  ```

#### Execute Tool

Executes a tool with the provided arguments.

- **URL**: `/tools/execute`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "toolName": "createGraph2D",
    "arguments": {
      "expression": "y=x^2",
      "xRange": [-5, 5],
      "yRange": [-5, 25],
      "title": "Parabola"
    },
    "executionId": "optional-custom-id"
  }
  ```
- **Response**:
  ```json
  {
    "result": {
      "visualizationId": "viz-123",
      "renderData": {
        "format": "svg",
        "data": "<svg>...</svg>",
        "width": 800,
        "height": 600
      },
      "interactiveUrl": "https://example.com/interactive/viz-123"
    },
    "resources": [
      {
        "id": "viz-123",
        "type": "visualization/2d-graph",
        "data": {
          "expression": "y=x^2",
          "xRange": [-5, 5],
          "yRange": [-5, 25],
          "dataPoints": [
            // ... data points
          ]
        },
        "metadata": {
          "title": "Parabola",
          "timestamp": "2025-05-19T15:35:00Z"
        }
      }
    ]
  }
  ```

### Prompt Management

#### Get Prompts

Retrieves available prompts.

- **URL**: `/prompts`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "filter": {
      "title": "Math"
    }
  }
  ```
- **Response**:
  ```json
  [
    {
      "id": "mathVisualization",
      "title": "Create a Mathematical Visualization",
      "description": "Create a visualization for a mathematical concept or problem",
      "inputSchema": {
        "type": "object",
        "required": ["concept"],
        "properties": {
          "concept": {
            "type": "string",
            "description": "Mathematical concept to visualize (e.g., \"quadratic function\", \"pythagorean theorem\")"
          },
          // ... more properties
        }
      }
    }
  ]
  ```

#### Execute Prompt

Executes a prompt with the provided arguments.

- **URL**: `/prompts/execute`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "promptId": "mathVisualization",
    "arguments": {
      "concept": "quadratic function",
      "complexity": "intermediate",
      "format": "2d"
    },
    "executionId": "optional-custom-id"
  }
  ```
- **Response**:
  ```json
  {
    "result": {
      "visualizationId": "viz-456",
      "explanationId": "exp-123",
      "message": "Created an intermediate level 2d visualization of quadratic function"
    },
    "resources": [
      {
        "id": "viz-456",
        "type": "visualization/2d",
        "data": {
          "concept": "quadratic function",
          "complexity": "intermediate",
          "format": "2d"
        },
        "metadata": {
          "title": "Visualization of quadratic function",
          "timestamp": "2025-05-19T15:40:00Z"
        }
      },
      {
        "id": "exp-123",
        "type": "explanation",
        "data": {
          "concept": "quadratic function",
          "explanation": "This is an intermediate level explanation of quadratic function.",
          "steps": [
            "Step 1: Introduction to the concept",
            "Step 2: Key properties and formulas",
            "Step 3: Visual representation and interpretation"
          ]
        },
        "metadata": {
          "title": "Explanation of quadratic function",
          "timestamp": "2025-05-19T15:40:00Z"
        }
      }
    ]
  }
  ```

### Event Streaming

#### Resource Change Notifications

Subscribes to server-sent events for resource changes.

- **URL**: `/events`
- **Method**: `GET`
- **Response**: Server-sent events stream

Example event:
```
event: resource_change
data: {
  "subscriptionId": "subscription-123",
  "changes": [
    {
      "type": "created",
      "resource": {
        "id": "resource-789",
        "type": "visualization/2d-graph",
        "data": {
          // ... resource data
        },
        "metadata": {
          "title": "New Visualization",
          "timestamp": "2025-05-19T15:45:00Z"
        }
      }
    }
  ]
}
```

## Error Handling

All API endpoints return standard error responses in case of failure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "context": {
      // Additional context about the error
    },
    "recovery": {
      "recoverable": false,
      "retryable": false,
      "alternatives": [
        "Alternative action 1",
        "Alternative action 2"
      ],
      "suggestedAction": "Suggested action"
    }
  }
}
```

Common error codes:

| Code | Description |
|------|-------------|
| `TOOL_NOT_FOUND` | The requested tool was not found |
| `PROMPT_NOT_FOUND` | The requested prompt was not found |
| `INVALID_ARGUMENTS` | The provided arguments are invalid |
| `TOOL_EXECUTION_FAILED` | The tool execution failed |
| `PROMPT_EXECUTION_FAILED` | The prompt execution failed |
| `INTERNAL_ERROR` | An internal server error occurred |

## Performance Considerations

- The server is designed to handle up to 100 concurrent users
- Response times for baseline operations are under 1 second
- Complex visualizations may take longer to generate
- The server implements caching to improve performance for repeated requests

## Examples

### Creating a 2D Graph

**Request:**
```http
POST /mcp/tools/execute HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "toolName": "createGraph2D",
  "arguments": {
    "expression": "y=sin(x)",
    "xRange": [-3.14, 3.14],
    "yRange": [-1.5, 1.5],
    "title": "Sine Wave"
  }
}
```

**Response:**
```json
{
  "result": {
    "visualizationId": "viz-789",
    "renderData": {
      "format": "svg",
      "data": "<svg>...</svg>",
      "width": 800,
      "height": 600
    },
    "interactiveUrl": "https://example.com/interactive/viz-789"
  },
  "resources": [
    {
      "id": "viz-789",
      "type": "visualization/2d-graph",
      "data": {
        "expression": "y=sin(x)",
        "xRange": [-3.14, 3.14],
        "yRange": [-1.5, 1.5],
        "dataPoints": [
          { "x": -3.14, "y": 0 },
          { "x": -3.0, "y": -0.14112 },
          // ... more data points
          { "x": 3.14, "y": 0 }
        ]
      },
      "metadata": {
        "title": "Sine Wave",
        "timestamp": "2025-05-19T15:50:00Z"
      }
    }
  ]
}
```

### Solving an Equation

**Request:**
```http
POST /mcp/tools/execute HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "toolName": "solveEquation",
  "arguments": {
    "equation": "x^2-4=0",
    "variable": "x",
    "visualize": true
  }
}
```

**Response:**
```json
{
  "result": {
    "solutions": ["x = 2", "x = -2"],
    "steps": [
      {
        "description": "Identify the quadratic equation in standard form",
        "equation": "x^2-4=0"
      },
      {
        "description": "Rearrange to standard form ax^2 + bx + c = 0",
        "equation": "x^2 + 0x - 4 = 0"
      },
      {
        "description": "Apply the quadratic formula",
        "equation": "x = (-b ± √(b² - 4ac)) / 2a"
      },
      {
        "description": "Substitute values: a=1, b=0, c=-4",
        "equation": "x = (0 ± √(0² - 4×1×(-4))) / 2×1"
      },
      {
        "description": "Simplify",
        "equation": "x = ±√16 / 2 = ±4/2 = ±2"
      }
    ],
    "visualizationId": "viz-101"
  },
  "resources": [
    {
      "id": "viz-101",
      "type": "visualization/equation-solution",
      "data": {
        "equation": "x^2-4=0",
        "variable": "x",
        "solutions": ["x = 2", "x = -2"]
      },
      "metadata": {
        "title": "Solution of x^2-4=0",
        "timestamp": "2025-05-19T15:55:00Z"
      }
    }
  ]
}
```

## Conclusion

This API documentation provides a comprehensive guide to the MCP Server API. For additional information or support, please refer to the project documentation or contact the development team.

