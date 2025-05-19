# MCP Standardized Request/Response Handlers

This module provides standardized request and response handling for the MCP (Model Context Protocol) server. It includes consistent error formats, request validation, and response formatting.

## Components

### Request Handlers

- `handleRequest`: Wraps a request handler with standardized processing, including request ID generation, validation, and performance metrics.
- `createRequestHandler`: Creates a request handler for a specific operation with logging.

### Response Handlers

- `sendSuccess`: Sends a successful response with standardized format.
- `sendError`: Sends an error response with standardized format.
- `sendNoContent`: Sends a 204 No Content response.
- `sendCreated`: Sends a 201 Created response.
- `sendAccepted`: Sends a 202 Accepted response.

### Error Handling

- `MCPError`: Custom error class for MCP operations.
- `createError`: Creates a standardized error response.
- `mcpErrorHandler`: Global error handler middleware for MCP routes.
- `ErrorCode`: Enum of standard error codes.
- `ErrorStatusMap`: Maps error codes to HTTP status codes.
- `ErrorMessages`: Standard error messages for error codes.

### Validation

- `validateRequest`: Validates a request against a schema.
- `createValidationSchema`: Creates a validation schema for a request.
- `createToolExecutionSchema`: Creates a validation schema for tool execution.
- `createPromptExecutionSchema`: Creates a validation schema for prompt execution.

## Usage Examples

### Request Handler

```typescript
// Create a request handler with validation
router.post('/tools/execute', createRequestHandler(
  'executeTool',
  async (req, res) => {
    const result = await mcpServer.executeTool(req.body);
    sendSuccess(res, result);
  },
  ValidationSchemas.executeTool
));
```

### Error Handling

```typescript
try {
  // Some operation
} catch (error) {
  throw createError(
    ErrorCode.TOOL_EXECUTION_ERROR,
    'Failed to execute tool',
    { toolName: 'myTool', arguments: args }
  );
}
```

### Response Formatting

```typescript
// Success response
sendSuccess(res, data);

// Error response
sendError(res, error, 400);

// Created response
sendCreated(res, newResource);
```

## Standard Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO date string"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "context": {
      // Additional context
    },
    "recovery": {
      "recoverable": false,
      "retryable": false,
      "alternatives": ["alternative1", "alternative2"],
      "suggestedAction": "Suggested action"
    }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "ISO date string"
  }
}
```

## Error Codes

The module defines standard error codes for various scenarios:

- General errors: `INTERNAL_ERROR`, `VALIDATION_ERROR`, `NOT_FOUND`, etc.
- MCP specific errors: `SERVER_NOT_INITIALIZED`, `INVALID_REQUEST`, etc.
- Resource errors: `RESOURCE_NOT_FOUND`, `RESOURCE_ALREADY_EXISTS`, etc.
- Tool errors: `TOOL_NOT_FOUND`, `TOOL_EXECUTION_ERROR`, etc.
- Prompt errors: `PROMPT_NOT_FOUND`, `PROMPT_EXECUTION_ERROR`, etc.
- Math operation errors: `MATH_PARSING_ERROR`, `MATH_EVALUATION_ERROR`, etc.

Each error code is mapped to an appropriate HTTP status code and has a standard error message.

