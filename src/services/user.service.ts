import { getDatabase } from '../db/database';
import type { User, SafeUser } from '../models/types';
import { NotFoundError, ConflictError } from '../utils/errors';

export function createUser(
  name: string,
  email: string,
  hashedPassword: string,
  department: string,
  role: string = 'EMPLOYEE'
): User {
  const db = getDatabase();

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    throw new ConflictError('Email already exists');
  }

  const stmt = db.prepare(
    'INSERT INTO users (name, email, hashed_password, role, department) VALUES (?, ?, ?, ?, ?)'
  );

  const result = stmt.run(name, email, hashedPassword, role, department);

  const user = db
    .prepare('SELECT * FROM users WHERE id = ?')
    .get(result.lastInsertRowid) as User;

  return user;
}

export function getUserById(id: number): User | null {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
  return user || null;
}

export function getUserByEmail(email: string): User | null {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User | undefined;
  return user || null;
}

export function getAllUsers(): SafeUser[] {
  const db = getDatabase();
  const users = db
    .prepare('SELECT id, name, email, role, department, is_active, created_at FROM users ORDER BY name')
    .all() as SafeUser[];
  return users;
}

export function getUsersByDepartment(department: string): SafeUser[] {
  const db = getDatabase();
  const users = db
    .prepare(
      'SELECT id, name, email, role, department, is_active, created_at FROM users WHERE department = ? ORDER BY name'
    )
    .all(department) as SafeUser[];
  return users;
}

export function updateUserStatus(userId: number, isActive: boolean): User {
  const db = getDatabase();

  const user = getUserById(userId);
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const stmt = db.prepare('UPDATE users SET is_active = ? WHERE id = ?');
  stmt.run(isActive ? 1 : 0, userId);

  const updatedUser = getUserById(userId);
  if (!updatedUser) {
    throw new NotFoundError('User not found after update');
  }

  return updatedUser;
}

export function toSafeUser(user: User): SafeUser {
  const { hashed_password, ...safeUser } = user;
  return safeUser;
}

export function getActiveUsersByDepartment(department: string): SafeUser[] {
  const db = getDatabase();
  const users = db
    .prepare(
      'SELECT id, name, email, role, department, is_active, created_at FROM users WHERE department = ? AND is_active = 1 ORDER BY name'
    )
    .all(department) as SafeUser[];
  return users;
}
