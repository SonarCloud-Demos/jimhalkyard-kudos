import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { initDatabase } from './db/database';
import { logger } from './middleware/logger';
import { authenticate } from './middleware/auth';
import authRoutes from './routes/auth.routes';
import kudosRoutes from './routes/kudos.routes';
import feedbackRoutes from './routes/feedback.routes';
import adminRoutes from './routes/admin.routes';
import { AppError } from './utils/errors';

const app = new Hono();

initDatabase();

app.use('*', logger);

app.get('/', serveStatic({ path: './public/index.html' }));
app.get('/dashboard', authenticate, serveStatic({ path: './public/dashboard.html' }));
app.get('/kudos', authenticate, serveStatic({ path: './public/kudos.html' }));
app.get('/feedback', authenticate, serveStatic({ path: './public/feedback.html' }));
app.get('/admin', authenticate, serveStatic({ path: './public/admin.html' }));

app.use('/css/*', serveStatic({ root: './public' }));
app.use('/js/*', serveStatic({ root: './public' }));

app.route('/api/auth', authRoutes);
app.route('/api/kudos', kudosRoutes);
app.route('/api/feedback', feedbackRoutes);
app.route('/api/admin', adminRoutes);

app.onError((err, c) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        error: err.message,
      },
      err.statusCode
    );
  }

  return c.json(
    {
      success: false,
      error: 'Internal server error',
    },
    500
  );
});

app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Not found',
    },
    404
  );
});

const port = parseInt(process.env.PORT || '3000');

console.log(`\n🚀 Server starting on http://localhost:${port}`);
console.log(`   - Login page: http://localhost:${port}/`);
console.log(`   - Dashboard:  http://localhost:${port}/dashboard`);
console.log(`   - Kudos:      http://localhost:${port}/kudos`);
console.log(`   - Feedback:   http://localhost:${port}/feedback`);
console.log(`   - Admin:      http://localhost:${port}/admin\n`);

export default {
  port,
  fetch: app.fetch,
};
