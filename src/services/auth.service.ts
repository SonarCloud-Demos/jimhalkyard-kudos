import { SignJWT, jwtVerify } from 'jose';
import type { JWTPayload, User, FeedbackPost, UserRole } from '../models/types';
import { UnauthorizedError } from '../utils/errors';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-key-change-this'
);

export async function hashPassword(password: string): Promise<string> {
  return await Bun.password.hash(password, {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await Bun.password.verify(password, hashedPassword);
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JWTPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

export function canViewFeedback(user: User, feedback: FeedbackPost): boolean {
  // PUBLIC: everyone can view
  if (feedback.visibility === 'PUBLIC') {
    return true;
  }

  // MANAGER_ONLY: managers of same department only
  if (feedback.visibility === 'MANAGER_ONLY') {
    return user.role === 'MANAGER' && user.department === feedback.target_department;
  }

  // HR_ONLY: HR admins only
  if (feedback.visibility === 'HR_ONLY') {
    return user.role === 'HR_ADMIN';
  }

  return false;
}

export function shouldHideAuthor(user: User, feedback: FeedbackPost): boolean {
  // HR admins can always see the real author
  if (user.role === 'HR_ADMIN') {
    return false;
  }

  // For everyone else, hide author if feedback is anonymous
  return feedback.is_anonymous === 1;
}

export function requireRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    EMPLOYEE: 1,
    MANAGER: 2,
    HR_ADMIN: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
