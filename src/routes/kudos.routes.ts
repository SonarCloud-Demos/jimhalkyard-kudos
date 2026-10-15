import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import { limitUploadSize } from '../middleware/upload';
import {
  createKudos,
  getAllPublicKudos,
  getKudosById,
  getKudosReceivedByUser,
  getKudosGivenByUser,
} from '../services/kudos.service';
import { deleteImage, getStoredImage, saveOptionalImage } from '../services/image.service';
import { createKudosSchema } from '../models/types';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { parseSubmissionBody } from '../utils/submission';

const kudos = new Hono();

kudos.use('*', authenticate);

kudos.post('/', limitUploadSize, async (c) => {
  const user = c.get('user');
  const { fields, image } = await parseSubmissionBody(c);

  // Multipart form fields arrive as strings
  if (typeof fields.recipientId === 'string') {
    fields.recipientId = Number(fields.recipientId);
  }

  const validation = createKudosSchema.safeParse(fields);

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { recipientId, message } = validation.data;

  const imagePath = await saveOptionalImage(image);

  try {
    const kudosPost = createKudos(user.id, recipientId, message, imagePath);

    return c.json({
      success: true,
      kudos: kudosPost,
    });
  } catch (error) {
    if (imagePath) {
      await deleteImage(imagePath);
    }
    throw error;
  }
});

kudos.get('/', (c) => {
  const kudosPosts = getAllPublicKudos();
  return c.json({ kudos: kudosPosts });
});

kudos.get('/my-received', (c) => {
  const user = c.get('user');
  const kudosPosts = getKudosReceivedByUser(user.id);
  return c.json({ kudos: kudosPosts });
});

kudos.get('/my-given', (c) => {
  const user = c.get('user');
  const kudosPosts = getKudosGivenByUser(user.id);
  return c.json({ kudos: kudosPosts });
});

kudos.get('/:id/image', async (c) => {
  const user = c.get('user');
  const id = Number.parseInt(c.req.param('id'), 10);

  if (Number.isNaN(id)) {
    throw new ValidationError('Invalid kudos ID');
  }

  const kudosPost = getKudosById(id);

  if (!kudosPost?.image_path) {
    throw new NotFoundError('Image not found');
  }

  const isParticipant = kudosPost.author_id === user.id || kudosPost.recipient_id === user.id;

  if (!kudosPost.is_public && !isParticipant) {
    throw new ForbiddenError('You do not have permission to view this image');
  }

  const { file, contentType } = await getStoredImage(kudosPost.image_path);

  return new Response(file, {
    headers: {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache',
    },
  });
});

export default kudos;
