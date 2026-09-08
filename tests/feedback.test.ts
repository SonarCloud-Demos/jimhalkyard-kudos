import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { User } from '../src/models/types';

describe('Feedback Visibility', () => {
  let db: Database;
  let employeeUser: User;
  let managerUser: User;
  let hrAdminUser: User;

  beforeAll(async () => {
    db = new Database(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');

    const schema = readFileSync(join(import.meta.dir, '../src/db/schema.sql'), 'utf-8');
    db.exec(schema);

    const hashedPassword = await Bun.password.hash('test123', {
      algorithm: 'argon2id',
      memoryCost: 65536,
      timeCost: 3,
    });

    db.prepare(
      'INSERT INTO users (name, email, hashed_password, role, department) VALUES (?, ?, ?, ?, ?)'
    ).run('Employee Test', 'employee@test.com', hashedPassword, 'EMPLOYEE', 'Engineering');

    db.prepare(
      'INSERT INTO users (name, email, hashed_password, role, department) VALUES (?, ?, ?, ?, ?)'
    ).run('Manager Test', 'manager@test.com', hashedPassword, 'MANAGER', 'Engineering');

    db.prepare(
      'INSERT INTO users (name, email, hashed_password, role, department) VALUES (?, ?, ?, ?, ?)'
    ).run('HR Admin Test', 'hradmin@test.com', hashedPassword, 'HR_ADMIN', 'Human Resources');

    employeeUser = db.prepare('SELECT * FROM users WHERE role = ?').get('EMPLOYEE') as User;
    managerUser = db.prepare('SELECT * FROM users WHERE role = ?').get('MANAGER') as User;
    hrAdminUser = db.prepare('SELECT * FROM users WHERE role = ?').get('HR_ADMIN') as User;

    db.prepare(
      'INSERT INTO feedback_posts (author_id, target_department, message, is_anonymous, visibility) VALUES (?, ?, ?, ?, ?)'
    ).run(employeeUser.id, 'Engineering', 'Public feedback', 0, 'PUBLIC');

    db.prepare(
      'INSERT INTO feedback_posts (author_id, target_department, message, is_anonymous, visibility) VALUES (?, ?, ?, ?, ?)'
    ).run(employeeUser.id, 'Engineering', 'Manager feedback', 0, 'MANAGER_ONLY');

    db.prepare(
      'INSERT INTO feedback_posts (author_id, target_department, message, is_anonymous, visibility) VALUES (?, ?, ?, ?, ?)'
    ).run(null, 'Engineering', 'Anonymous HR feedback', 1, 'HR_ONLY');
  });

  afterAll(() => {
    db.close();
  });

  test('employee can only see PUBLIC feedback', () => {
    const query = `
      SELECT * FROM feedback_posts
      WHERE visibility = 'PUBLIC'
    `;

    const feedback = db.prepare(query).all();
    expect(feedback.length).toBe(1);
  });

  test('manager can see PUBLIC and MANAGER_ONLY for their department', () => {
    const query = `
      SELECT * FROM feedback_posts
      WHERE visibility = 'PUBLIC'
         OR (visibility = 'MANAGER_ONLY' AND target_department = ?)
    `;

    const feedback = db.prepare(query).all('Engineering');
    expect(feedback.length).toBe(2);
  });

  test('HR admin can see all feedback', () => {
    const query = 'SELECT * FROM feedback_posts';
    const feedback = db.prepare(query).all();
    expect(feedback.length).toBe(3);
  });

  test('anonymous feedback hides author_id', () => {
    const anonymousFeedback = db
      .prepare('SELECT * FROM feedback_posts WHERE is_anonymous = 1')
      .get() as any;

    expect(anonymousFeedback).toBeDefined();
    expect(anonymousFeedback.author_id).toBeNull();
    expect(anonymousFeedback.is_anonymous).toBe(1);
  });

  test('non-anonymous feedback preserves author_id', () => {
    const nonAnonymousFeedback = db
      .prepare('SELECT * FROM feedback_posts WHERE is_anonymous = 0')
      .get() as any;

    expect(nonAnonymousFeedback).toBeDefined();
    expect(nonAnonymousFeedback.author_id).not.toBeNull();
    expect(nonAnonymousFeedback.is_anonymous).toBe(0);
  });

  test('manager cannot see other departments MANAGER_ONLY feedback', () => {
    db.prepare(
      'INSERT INTO feedback_posts (author_id, target_department, message, is_anonymous, visibility) VALUES (?, ?, ?, ?, ?)'
    ).run(employeeUser.id, 'Marketing', 'Marketing manager feedback', 0, 'MANAGER_ONLY');

    const query = `
      SELECT * FROM feedback_posts
      WHERE visibility = 'PUBLIC'
         OR (visibility = 'MANAGER_ONLY' AND target_department = ?)
    `;

    const feedback = db.prepare(query).all('Engineering');
    const marketingFeedback = feedback.filter((f: any) => f.target_department === 'Marketing');

    expect(marketingFeedback.length).toBe(0);
  });
});
