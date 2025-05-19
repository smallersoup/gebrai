import { Request, Response } from 'express';
import { sendSSEMessage, sendSSEComment } from '../../../src/mcp/handlers';

// Mock Express response
const mockResponse = () => {
  const res: Partial<Response> = {
    write: jest.fn(),
    req: {
      headers: {},
    } as any,
  };
  return res as Response;
};

describe('SSE Message Handlers', () => {
  describe('sendSSEMessage', () => {
    it('should format a simple SSE message correctly', () => {
      const res = mockResponse();
      
      sendSSEMessage(res, 'test message');
      
      expect(res.write).toHaveBeenCalledTimes(2);
      expect(res.write).toHaveBeenNthCalledWith(1, 'data: test message\n');
      expect(res.write).toHaveBeenNthCalledWith(2, '\n');
    });
    
    it('should format a message with event name correctly', () => {
      const res = mockResponse();
      
      sendSSEMessage(res, 'test message', 'update');
      
      expect(res.write).toHaveBeenCalledTimes(3);
      expect(res.write).toHaveBeenNthCalledWith(1, 'event: update\n');
      expect(res.write).toHaveBeenNthCalledWith(2, 'data: test message\n');
      expect(res.write).toHaveBeenNthCalledWith(3, '\n');
    });
    
    it('should format a message with all fields correctly', () => {
      const res = mockResponse();
      
      sendSSEMessage(res, 'test message', 'update', '123', 3000);
      
      expect(res.write).toHaveBeenCalledTimes(5);
      expect(res.write).toHaveBeenNthCalledWith(1, 'event: update\n');
      expect(res.write).toHaveBeenNthCalledWith(2, 'id: 123\n');
      expect(res.write).toHaveBeenNthCalledWith(3, 'retry: 3000\n');
      expect(res.write).toHaveBeenNthCalledWith(4, 'data: test message\n');
      expect(res.write).toHaveBeenNthCalledWith(5, '\n');
    });
    
    it('should handle object data correctly', () => {
      const res = mockResponse();
      const data = { key: 'value', nested: { prop: 'test' } };
      
      sendSSEMessage(res, data);
      
      expect(res.write).toHaveBeenCalledTimes(2);
      expect(res.write).toHaveBeenNthCalledWith(1, `data: ${JSON.stringify(data)}\n`);
      expect(res.write).toHaveBeenNthCalledWith(2, '\n');
    });
    
    it('should handle multi-line string data correctly', () => {
      const res = mockResponse();
      const data = 'line 1\nline 2\nline 3';
      
      sendSSEMessage(res, data);
      
      expect(res.write).toHaveBeenCalledTimes(4);
      expect(res.write).toHaveBeenNthCalledWith(1, 'data: line 1\n');
      expect(res.write).toHaveBeenNthCalledWith(2, 'data: line 2\n');
      expect(res.write).toHaveBeenNthCalledWith(3, 'data: line 3\n');
      expect(res.write).toHaveBeenNthCalledWith(4, '\n');
    });
  });
  
  describe('sendSSEComment', () => {
    it('should format an SSE comment correctly', () => {
      const res = mockResponse();
      
      sendSSEComment(res, 'keepalive');
      
      expect(res.write).toHaveBeenCalledTimes(1);
      expect(res.write).toHaveBeenCalledWith(': keepalive\n\n');
    });
  });
});

