import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createFeedback,
  getFeedbackVisibleToUser,
  getFeedbackById,
  getFeedbackByDepartment,
} from '../services/feedback.service';
import { deleteImage, getStoredImage, saveOptionalImage } from '../services/image.service';
import { limitUploadSize } from '../middleware/upload';
import { createFeedbackSchema } from '../models/types';
import { NotFoundError, ValidationError } from '../utils/errors';
import { parseSubmissionBody } from '../utils/submission';

const feedback = new Hono();

feedback.use('*', authenticate);

feedback.post('/', limitUploadSize, async (c) => {
  const user = c.get('user');
  const { fields, image } = await parseSubmissionBody(c);

  // Multipart form fields arrive as strings
  if (typeof fields.isAnonymous === 'string') {
    fields.isAnonymous = fields.isAnonymous === 'true';
  }

  const validation = createFeedbackSchema.safeParse(fields);

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { targetDepartment, message, isAnonymous, visibility } = validation.data;

  const imagePath = await saveOptionalImage(image);

  try {
    const feedbackPost = createFeedback(
      user.id,
      targetDepartment,
      message,
      isAnonymous,
      visibility,
      imagePath
    );

    return c.json({
      success: true,
      feedback: feedbackPost,
    });
  } catch (error) {
    if (imagePath) {
      await deleteImage(imagePath);
    }
    throw error;
  }
});

feedback.get('/', (c) => {
  const user = c.get('user');
  const feedbackPosts = getFeedbackVisibleToUser(user);
  return c.json({ feedback: feedbackPosts });
});

feedback.get('/:id', (c) => {
  const user = c.get('user');
  const id = Number.parseInt(c.req.param('id'), 10);

  if (Number.isNaN(id)) {
    throw new ValidationError('Invalid feedback ID');
  }

  const feedbackPost = getFeedbackById(id, user);
  return c.json({ feedback: feedbackPost });
});

feedback.get('/:id/image', async (c) => {
  const user = c.get('user');
  const id = Number.parseInt(c.req.param('id'), 10);

  if (Number.isNaN(id)) {
    throw new ValidationError('Invalid feedback ID');
  }

  // getFeedbackById enforces the same visibility rules as the post itself
  const feedbackPost = getFeedbackById(id, user);

  if (!feedbackPost.image_path) {
    throw new NotFoundError('Image not found');
  }

  const { file, contentType } = await getStoredImage(feedbackPost.image_path);

  return new Response(file, {
    headers: {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache',
    },
  });
});

feedback.get('/department/:department', (c) => {
  const user = c.get('user');
  const department = c.req.param('department');

  const feedbackPosts = getFeedbackByDepartment(department, user);
  return c.json({ feedback: feedbackPosts });
});

export default feedback;
