import type { Context, Next } from 'hono';

export async function logger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const elapsed = Date.now() - start;
  const status = c.res.status;

  const logColor = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : '\x1b[32m';
  const resetColor = '\x1b[0m';

  console.log(`${logColor}${method} ${path} ${status}${resetColor} - ${elapsed}ms`);
}
