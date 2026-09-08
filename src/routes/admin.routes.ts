import { Hono } from 'hono';
import { authenticate, requireRole } from '../middleware/auth';
import { getAllUsers, updateUserStatus } from '../services/user.service';
import { getAllFeedbackForAdmin } from '../services/feedback.service';
import { updateUserStatusSchema } from '../models/types';
import { ValidationError } from '../utils/errors';

const admin = new Hono();

admin.use('*', authenticate, requireRole('HR_ADMIN'));

admin.get('/users', (c) => {
  const users = getAllUsers();
  return c.json({ users });
});

admin.patch('/users/:id/status', async (c) => {
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    throw new ValidationError('Invalid user ID');
  }

  const body = await c.req.json();
  const validation = updateUserStatusSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { isActive } = validation.data;

  const updatedUser = updateUserStatus(id, isActive);

  return c.json({
    success: true,
    user: updatedUser,
  });
});

admin.get('/feedback/all', (c) => {
  const feedbackPosts = getAllFeedbackForAdmin();
  return c.json({ feedback: feedbackPosts });
});

export default admin;
