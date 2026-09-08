import type { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../services/auth.service';
import { getUserById } from '../services/user.service';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import type { User, UserRole } from '../models/types';

declare module 'hono' {
  interface ContextVariableMap {
    user: User;
  }
}

export async function authenticate(c: Context, next: Next) {
  try {
    const token = getCookie(c, 'authToken');

    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const payload = await verifyToken(token);
    const user = getUserById(payload.userId);

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.is_active) {
      throw new ForbiddenError('User account is deactivated');
    }

    c.set('user', user);
    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new UnauthorizedError('Authentication failed');
  }
}

export function requireRole(requiredRole: UserRole) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    if (!user) {
      throw new UnauthorizedError('User not authenticated');
    }

    const roleHierarchy: Record<UserRole, number> = {
      EMPLOYEE: 1,
      MANAGER: 2,
      HR_ADMIN: 3,
    };

    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      throw new ForbiddenError('Insufficient permissions');
    }

    await next();
  };
}
