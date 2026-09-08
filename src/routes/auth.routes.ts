import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { hashPassword, verifyPassword, generateToken } from '../services/auth.service';
import { createUser, getUserByEmail, toSafeUser } from '../services/user.service';
import { registerSchema, loginSchema } from '../models/types';
import { ValidationError, UnauthorizedError } from '../utils/errors';
import { authenticate } from '../middleware/auth';

const auth = new Hono();

auth.post('/register', async (c) => {
  const body = await c.req.json();
  const validation = registerSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { name, email, password, department } = validation.data;

  const hashedPassword = await hashPassword(password);
  const user = createUser(name, email, hashedPassword, department);

  const token = await generateToken({
    userId: user.id,
    role: user.role,
    department: user.department,
  });

  setCookie(c, 'authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 86400,
    path: '/',
  });

  return c.json({
    success: true,
    user: toSafeUser(user),
  });
});

auth.post('/login', async (c) => {
  const body = await c.req.json();
  const validation = loginSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError(validation.error.errors[0].message);
  }

  const { email, password } = validation.data;

  const user = getUserByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.is_active) {
    throw new UnauthorizedError('Account is deactivated');
  }

  const isValid = await verifyPassword(password, user.hashed_password);
  if (!isValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const token = await generateToken({
    userId: user.id,
    role: user.role,
    department: user.department,
  });

  setCookie(c, 'authToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 86400,
    path: '/',
  });

  return c.json({
    success: true,
    user: toSafeUser(user),
  });
});

auth.post('/logout', (c) => {
  deleteCookie(c, 'authToken', {
    path: '/',
  });

  return c.json({ success: true, message: 'Logged out successfully' });
});

auth.get('/me', authenticate, (c) => {
  const user = c.get('user');
  return c.json({ user: toSafeUser(user) });
});

export default auth;
