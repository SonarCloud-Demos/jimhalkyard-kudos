import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createFeedback,
  getFeedbackVisibleToUser,
  getFeedbackById,
  getFeedbackByDepartment,
} from '../services/feedback.service';
import { createFeedbackSchema } from '../models/types';
import { ValidationError } from '../utils/errors';

const feedback = new Hono();

feedback.use('*', authenticate);

feedback.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const validation = createFeedbackSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { targetDepartment, message, isAnonymous, visibility } = validation.data;

  const feedbackPost = createFeedback(
    user.id,
    targetDepartment,
    message,
    isAnonymous,
    visibility
  );

  return c.json({
    success: true,
    feedback: feedbackPost,
  });
});

feedback.get('/', (c) => {
  const user = c.get('user');
  const feedbackPosts = getFeedbackVisibleToUser(user);
  return c.json({ feedback: feedbackPosts });
});

feedback.get('/:id', (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    throw new ValidationError('Invalid feedback ID');
  }

  const feedbackPost = getFeedbackById(id, user);
  return c.json({ feedback: feedbackPost });
});

feedback.get('/department/:department', (c) => {
  const user = c.get('user');
  const department = c.req.param('department');

  const feedbackPosts = getFeedbackByDepartment(department, user);
  return c.json({ feedback: feedbackPosts });
});

export default feedback;
