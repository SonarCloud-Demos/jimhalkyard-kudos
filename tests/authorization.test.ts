import { describe, test, expect } from 'bun:test';
import { canViewFeedback, shouldHideAuthor, requireRole } from '../src/services/auth.service';
import type { User, FeedbackPost } from '../src/models/types';

describe('Authorization Service', () => {
  const employeeUser: User = {
    id: 1,
    name: 'Employee User',
    email: 'employee@test.com',
    hashed_password: 'hashed',
    role: 'EMPLOYEE',
    department: 'Engineering',
    is_active: 1,
    created_at: new Date().toISOString(),
  };

  const managerUser: User = {
    id: 2,
    name: 'Manager User',
    email: 'manager@test.com',
    hashed_password: 'hashed',
    role: 'MANAGER',
    department: 'Engineering',
    is_active: 1,
    created_at: new Date().toISOString(),
  };

  const hrAdminUser: User = {
    id: 3,
    name: 'HR Admin User',
    email: 'hradmin@test.com',
    hashed_password: 'hashed',
    role: 'HR_ADMIN',
    department: 'Human Resources',
    is_active: 1,
    created_at: new Date().toISOString(),
  };

  describe('canViewFeedback', () => {
    test('everyone can view PUBLIC feedback', () => {
      const publicFeedback: FeedbackPost = {
        id: 1,
        author_id: 1,
        target_department: 'Engineering',
        message: 'Test feedback',
        is_anonymous: 0,
        visibility: 'PUBLIC',
        created_at: new Date().toISOString(),
      };

      expect(canViewFeedback(employeeUser, publicFeedback)).toBe(true);
      expect(canViewFeedback(managerUser, publicFeedback)).toBe(true);
      expect(canViewFeedback(hrAdminUser, publicFeedback)).toBe(true);
    });

    test('only managers of same department can view MANAGER_ONLY feedback', () => {
      const managerOnlyFeedback: FeedbackPost = {
        id: 2,
        author_id: 1,
        target_department: 'Engineering',
        message: 'Manager feedback',
        is_anonymous: 0,
        visibility: 'MANAGER_ONLY',
        created_at: new Date().toISOString(),
      };

      expect(canViewFeedback(employeeUser, managerOnlyFeedback)).toBe(false);
      expect(canViewFeedback(managerUser, managerOnlyFeedback)).toBe(true);
      expect(canViewFeedback(hrAdminUser, managerOnlyFeedback)).toBe(false);
    });

    test('manager cannot view MANAGER_ONLY feedback for other departments', () => {
      const otherDeptFeedback: FeedbackPost = {
        id: 3,
        author_id: 1,
        target_department: 'Marketing',
        message: 'Marketing feedback',
        is_anonymous: 0,
        visibility: 'MANAGER_ONLY',
        created_at: new Date().toISOString(),
      };

      expect(canViewFeedback(managerUser, otherDeptFeedback)).toBe(false);
    });

    test('only HR admins can view HR_ONLY feedback', () => {
      const hrOnlyFeedback: FeedbackPost = {
        id: 4,
        author_id: 1,
        target_department: 'Engineering',
        message: 'HR feedback',
        is_anonymous: 0,
        visibility: 'HR_ONLY',
        created_at: new Date().toISOString(),
      };

      expect(canViewFeedback(employeeUser, hrOnlyFeedback)).toBe(false);
      expect(canViewFeedback(managerUser, hrOnlyFeedback)).toBe(false);
      expect(canViewFeedback(hrAdminUser, hrOnlyFeedback)).toBe(true);
    });
  });

  describe('shouldHideAuthor', () => {
    test('HR admin can always see author', () => {
      const anonymousFeedback: FeedbackPost = {
        id: 1,
        author_id: 1,
        target_department: 'Engineering',
        message: 'Test',
        is_anonymous: 1,
        visibility: 'PUBLIC',
        created_at: new Date().toISOString(),
      };

      expect(shouldHideAuthor(hrAdminUser, anonymousFeedback)).toBe(false);
    });

    test('non-HR users cannot see author of anonymous feedback', () => {
      const anonymousFeedback: FeedbackPost = {
        id: 1,
        author_id: 1,
        target_department: 'Engineering',
        message: 'Test',
        is_anonymous: 1,
        visibility: 'PUBLIC',
        created_at: new Date().toISOString(),
      };

      expect(shouldHideAuthor(employeeUser, anonymousFeedback)).toBe(true);
      expect(shouldHideAuthor(managerUser, anonymousFeedback)).toBe(true);
    });

    test('author is visible for non-anonymous feedback', () => {
      const nonAnonymousFeedback: FeedbackPost = {
        id: 1,
        author_id: 1,
        target_department: 'Engineering',
        message: 'Test',
        is_anonymous: 0,
        visibility: 'PUBLIC',
        created_at: new Date().toISOString(),
      };

      expect(shouldHideAuthor(employeeUser, nonAnonymousFeedback)).toBe(false);
      expect(shouldHideAuthor(managerUser, nonAnonymousFeedback)).toBe(false);
      expect(shouldHideAuthor(hrAdminUser, nonAnonymousFeedback)).toBe(false);
    });
  });

  describe('requireRole', () => {
    test('HR_ADMIN has highest permission level', () => {
      expect(requireRole('HR_ADMIN', 'HR_ADMIN')).toBe(true);
      expect(requireRole('HR_ADMIN', 'MANAGER')).toBe(true);
      expect(requireRole('HR_ADMIN', 'EMPLOYEE')).toBe(true);
    });

    test('MANAGER has middle permission level', () => {
      expect(requireRole('MANAGER', 'EMPLOYEE')).toBe(true);
      expect(requireRole('MANAGER', 'MANAGER')).toBe(true);
      expect(requireRole('MANAGER', 'HR_ADMIN')).toBe(false);
    });

    test('EMPLOYEE has lowest permission level', () => {
      expect(requireRole('EMPLOYEE', 'EMPLOYEE')).toBe(true);
      expect(requireRole('EMPLOYEE', 'MANAGER')).toBe(false);
      expect(requireRole('EMPLOYEE', 'HR_ADMIN')).toBe(false);
    });
  });
});
