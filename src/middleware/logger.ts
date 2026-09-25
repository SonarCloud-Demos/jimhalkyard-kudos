import type { Context, Next } from 'hono';

const SERVER_ERROR_STATUS = 500;
const CLIENT_ERROR_STATUS = 400;

export async function logger(c: Context, next: Next) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;

  await next();

  const elapsed = Date.now() - start;
  const status = c.res.status;

  let logColor: string;
  if (status >= SERVER_ERROR_STATUS) {
    logColor = '\x1b[31m';
  } else if (status >= CLIENT_ERROR_STATUS) {
    logColor = '\x1b[33m';
  } else {
    logColor = '\x1b[32m';
  }
  const resetColor = '\x1b[0m';


  console.info({ path, method: `${logColor}${method}`, status: `${status}${resetColor}`, elapsed: `${elapsed}ms` });
}
