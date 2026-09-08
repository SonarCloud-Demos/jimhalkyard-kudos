import { Hono } from 'hono';
import { authenticate } from '../middleware/auth';
import {
  createKudos,
  getAllPublicKudos,
  getKudosReceivedByUser,
  getKudosGivenByUser,
} from '../services/kudos.service';
import { createKudosSchema } from '../models/types';
import { ValidationError } from '../utils/errors';

const kudos = new Hono();

kudos.use('*', authenticate);

kudos.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const validation = createKudosSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { recipientId, message } = validation.data;

  const kudosPost = createKudos(user.id, recipientId, message);

  return c.json({
    success: true,
    kudos: kudosPost,
  });
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

export default kudos;
