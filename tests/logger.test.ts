import { describe, test, expect, beforeEach, spyOn } from 'bun:test';
import { logger } from '../src/middleware/logger';
import type { Context, Next } from 'hono';

describe('Logger Middleware', () => {
  let mockContext: Context;
  let mockNext: Next;
  let consoleInfoSpy: any;

  beforeEach(() => {
    if (consoleInfoSpy) {
      consoleInfoSpy.mockRestore();
    }
    consoleInfoSpy = spyOn(console, 'info');

    mockContext = {
      req: {
        method: 'GET',
        path: '/test',
      },
      res: {
        status: 200,
      },
    } as unknown as Context;

    mockNext = async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    };
  });

  test.each([
    [200, '\x1b[32m', 'success (2xx)'],
    [404, '\x1b[33m', 'client error (4xx)'],
    [400, '\x1b[33m', 'client error 400'],
    [500, '\x1b[31m', 'server error (5xx)'],
    [503, '\x1b[31m', 'server error 503'],
  ])('logs request with status %i in correct color for %s', async (status, expectedColor, _description) => {
    mockContext.res.status = status;

    await logger(mockContext, mockNext);

    expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    const loggedData = consoleInfoSpy.mock.calls[0][0];
    expect(loggedData.method).toContain(expectedColor);
    expect(loggedData.status).toContain(status.toString());
  });

  test('logs elapsed time', async () => {
    await logger(mockContext, mockNext);

    const loggedData = consoleInfoSpy.mock.calls[0][0];
    expect(loggedData.elapsed).toMatch(/\d+ms/);
    expect(parseInt(loggedData.elapsed)).toBeGreaterThanOrEqual(10);
  });

  test('logs POST requests correctly', async () => {
    mockContext.req.method = 'POST';
    mockContext.req.path = '/api/users';

    await logger(mockContext, mockNext);

    const loggedData = consoleInfoSpy.mock.calls[0][0];
    expect(loggedData.method).toContain('POST');
    expect(loggedData.path).toBe('/api/users');
  });

  test('logs different paths correctly', async () => {
    mockContext.req.path = '/api/feedback/123';

    await logger(mockContext, mockNext);

    const loggedData = consoleInfoSpy.mock.calls[0][0];
    expect(loggedData.path).toBe('/api/feedback/123');
  });
});
