import { z } from 'zod';

// User types
export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'HR_ADMIN';

export interface User {
  id: number;
  name: string;
  email: string;
  hashed_password: string;
  role: UserRole;
  department: string;
  is_active: number;
  created_at: string;
}

export interface SafeUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  is_active: number;
  created_at: string;
}

// Kudos types
export interface KudosPost {
  id: number;
  author_id: number;
  recipient_id: number;
  message: string;
  is_public: number;
  created_at: string;
}

export interface KudosPostWithNames extends KudosPost {
  author_name: string;
  recipient_name: string;
}

// Feedback types
export type FeedbackVisibility = 'PUBLIC' | 'MANAGER_ONLY' | 'HR_ONLY';

export interface FeedbackPost {
  id: number;
  author_id: number | null;
  target_department: string;
  message: string;
  is_anonymous: number;
  visibility: FeedbackVisibility;
  created_at: string;
}

export interface FeedbackPostWithAuthor extends FeedbackPost {
  author_name: string | null;
}

// JWT Payload
export interface JWTPayload {
  userId: number;
  role: UserRole;
  department: string;
}

// Zod validation schemas
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  department: z.string().min(1, 'Department is required').max(100),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createKudosSchema = z.object({
  recipientId: z.number().int().positive('Recipient ID must be a positive integer'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
});

export const createFeedbackSchema = z.object({
  targetDepartment: z.string().min(1, 'Target department is required').max(100),
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
  isAnonymous: z.boolean().default(false),
  visibility: z.enum(['PUBLIC', 'MANAGER_ONLY', 'HR_ONLY']),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
