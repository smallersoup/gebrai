// Test setup file
import 'dotenv/config';

// Set test environment variables
process.env['NODE_ENV'] = 'test';
process.env['LOG_LEVEL'] = 'error'; // Reduce log noise during tests

// Global test timeout
jest.setTimeout(10000); 