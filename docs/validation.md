# Request Parsing and Validation

This document describes the request parsing and validation implementation for the GeoGebra AI MCP Tool.

## Overview

The validation system ensures that all incoming requests are properly validated before processing. It includes:

1. **Request Validation Middleware**: Validates and sanitizes all incoming requests
2. **Schema-based Validation**: Uses Joi schemas to validate request structures
3. **Mathematical Expression Validation**: Specialized validation for mathematical operations
4. **Security Checks**: Prevents potentially dangerous operations
5. **Error Handling**: Graceful handling of malformed requests

## Validation Layers

The validation system consists of multiple layers:

### 1. Request Validation Middleware

Located in `src/middleware/requestValidator.ts`, this middleware:

- Validates request content type (must be application/json for POST requests)
- Validates request body size (configurable via MAX_REQUEST_SIZE environment variable)
- Sanitizes request body to prevent prototype pollution
- Handles malformed JSON in request body

### 2. Schema-based Validation

Located in `src/mcp/schemas/validationSchemas.ts`, these schemas:

- Define the expected structure for each type of request
- Validate required fields and field types
- Provide custom validation for specific fields

### 3. Tool-specific Validation

Located in `src/mcp/validation.ts`, this includes:

- Specialized validation for mathematical operations
- Security checks for potentially dangerous expressions
- Validation of mathematical expression format
- Range validation for graph parameters

## Mathematical Expression Validation

For mathematical operations, the system performs additional validation:

### Security Checks

- Checks for potentially dangerous operations (e.g., `eval()`, `setTimeout()`)
- Prevents code injection attempts
- Blocks access to global objects (e.g., `window`, `document`)

### Expression Format Validation

- Validates balanced parentheses
- Checks for invalid operator sequences
- Validates function calls against a whitelist of mathematical functions

### Tool-specific Validation

#### createGraph2D Tool

- Validates mathematical expression format
- Validates x and y ranges (min must be less than max)
- Validates color format

#### solveEquation Tool

- Validates equation format (must contain equals sign)
- Validates that the variable is present in the equation
- Validates variable name format

## Error Handling

The system provides detailed error messages for validation failures:

- Content type errors
- Request size errors
- JSON parsing errors
- Schema validation errors
- Mathematical expression errors

## Usage

The validation system is automatically applied to all incoming requests. No additional configuration is required.

### Environment Variables

- `MAX_REQUEST_SIZE`: Maximum allowed request body size in bytes (default: 1MB)
- `REQUEST_TIMEOUT`: Maximum allowed time for request processing in milliseconds (default: 30000)

## Testing

Comprehensive tests are available for all validation components:

- `tests/middleware/requestValidator.test.ts`: Tests for request validation middleware
- `tests/mcp/validation/mathValidation.test.ts`: Tests for mathematical expression validation
- `tests/mcp/schemas/validationSchemas.test.ts`: Tests for validation schemas

