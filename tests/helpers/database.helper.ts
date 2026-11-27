import type { Database } from 'bun:sqlite';
import { initDatabase, getDatabase, closeDatabase } from '../../src/db/database';

/**
 * Initializes an in-memory SQLite database with schema for testing
 * This initializes the database module itself, so all services will use this test database
 */
export function createTestDatabase(): Database {
  return initDatabase(':memory:');
}

/**
 * Seeds test database with sample users across roles and departments
 * Uses the initialized database from createTestDatabase()
 */
export async function seedTestUsers() {
  const db = getDatabase();
  const hashedPassword = await Bun.password.hash('test123', {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  const users = [
    ['Alice Employee', 'alice@test.com', hashedPassword, 'EMPLOYEE', 'Engineering'],
    ['Bob Manager', 'bob@test.com', hashedPassword, 'MANAGER', 'Engineering'],
    ['Carol HR', 'carol@test.com', hashedPassword, 'HR_ADMIN', 'Human Resources'],
    ['Dave Employee', 'dave@test.com', hashedPassword, 'EMPLOYEE', 'Marketing'],
    ['Eve Manager', 'eve@test.com', hashedPassword, 'MANAGER', 'Marketing'],
  ];

  const stmt = db.prepare(
    'INSERT INTO users (name, email, hashed_password, role, department) VALUES (?, ?, ?, ?, ?)'
  );

  users.forEach(user => stmt.run(...user));

  return {
    employee: db.prepare('SELECT * FROM users WHERE email = ?').get('alice@test.com'),
    manager: db.prepare('SELECT * FROM users WHERE email = ?').get('bob@test.com'),
    hrAdmin: db.prepare('SELECT * FROM users WHERE email = ?').get('carol@test.com'),
    employeeMarketing: db.prepare('SELECT * FROM users WHERE email = ?').get('dave@test.com'),
    managerMarketing: db.prepare('SELECT * FROM users WHERE email = ?').get('eve@test.com'),
  };
}

/**
 * Closes and cleans up test database
 */
export function closeTestDatabase() {
  closeDatabase();
}
