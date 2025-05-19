# MCP Server

This directory contains the implementation of the Model Context Protocol (MCP) server for the GeoGebra AI integration.

## Overview

The MCP server provides a standardized interface for AI assistants to interact with GeoGebra's mathematical visualization capabilities. It implements the Model Context Protocol, allowing AI models to request mathematical operations and visualizations.

## Key Components

- **Server**: Core server implementation that handles initialization, resource management, and tool execution
- **Routes**: Express routes for the MCP API endpoints
- **Handlers**: Request/response handlers and validation
- **Tools**: Implementations of mathematical tools (e.g., graph creation, equation solving)
- **Prompts**: Predefined prompts for common mathematical visualization tasks
- **Types**: TypeScript type definitions for the MCP protocol

## API Endpoints

The server exposes the following main endpoints:

- `/mcp/health`: Health check endpoint
- `/mcp/initialize`: Initialize the MCP server
- `/mcp/shutdown`: Shut down the MCP server
- `/mcp/resources`: Get, subscribe to, and unsubscribe from resources
- `/mcp/tools`: Get available tools and execute them
- `/mcp/prompts`: Get available prompts and execute them
- `/mcp/events`: SSE endpoint for resource change notifications

For detailed API documentation, see `docs/api/mcp-server-api.md`.

## Usage

The MCP server is automatically started when the main application is launched. It listens for connections on the configured port and handles requests according to the MCP protocol.

## Development

To extend the MCP server:

1. Add new tools in the `tools` directory and register them in `tools/registry.ts`
2. Add new prompts in the `prompts` directory and register them in `prompts/registry.ts`
3. Update the API documentation in `docs/api/mcp-server-api.md`

## Testing

Tests for the MCP server are located in the `tests/mcp` directory. Run them with:

```bash
npm test -- --testPathPattern=tests/mcp
```

