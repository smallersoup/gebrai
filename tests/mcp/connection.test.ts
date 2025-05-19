import { mcpServer } from '../../src/mcp/server';

// Mock the logger
jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Connection Tracking', () => {
  beforeEach(() => {
    // Reset connection count by creating a new instance
    jest.clearAllMocks();
  });

  it('should track connections correctly', () => {
    // Initial state
    const initialStatus = mcpServer.getStatus();
    expect(initialStatus.connections.active).toBe(0);

    // Register a connection
    mcpServer.registerConnection();
    const statusAfterRegister = mcpServer.getStatus();
    expect(statusAfterRegister.connections.active).toBe(1);

    // Register another connection
    mcpServer.registerConnection();
    const statusAfterSecondRegister = mcpServer.getStatus();
    expect(statusAfterSecondRegister.connections.active).toBe(2);

    // Unregister a connection
    mcpServer.unregisterConnection();
    const statusAfterUnregister = mcpServer.getStatus();
    expect(statusAfterUnregister.connections.active).toBe(1);

    // Unregister another connection
    mcpServer.unregisterConnection();
    const statusAfterSecondUnregister = mcpServer.getStatus();
    expect(statusAfterSecondUnregister.connections.active).toBe(0);

    // Unregister when count is already 0 (should not go negative)
    mcpServer.unregisterConnection();
    const statusAfterThirdUnregister = mcpServer.getStatus();
    expect(statusAfterThirdUnregister.connections.active).toBe(0);
  });
});

