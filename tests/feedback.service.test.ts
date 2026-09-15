import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import {
  createFeedback,
  getFeedbackVisibleToUser,
  getFeedbackById,
  getAllFeedbackForAdmin,
  getFeedbackByDepartment,
} from '../src/services/feedback.service';
import { createTestDatabase, seedTestUsers, closeTestDatabase } from './helpers/database.helper';
import { getDatabase } from '../src/db/database';
import { NotFoundError, ForbiddenError } from '../src/utils/errors';

describe('Feedback Service', () => {
  let testUsers: any;

  beforeAll(async () => {
    createTestDatabase();
    testUsers = await seedTestUsers();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  describe('createFeedback', () => {
    test('creates public feedback successfully', () => {
      const feedback = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'Great team collaboration',
        false,
        'PUBLIC'
      );

      expect(feedback).toBeDefined();
      expect(feedback.author_id).toBe(testUsers.employee.id);
      expect(feedback.target_department).toBe('Engineering');
      expect(feedback.message).toBe('Great team collaboration');
      expect(feedback.is_anonymous).toBe(0);
      expect(feedback.visibility).toBe('PUBLIC');
    });

    test('creates anonymous feedback while storing the real author_id', () => {
      const feedback = createFeedback(
        testUsers.manager.id,
        'Marketing',
        'Anonymous feedback message',
        true,
        'PUBLIC'
      );

      expect(feedback.author_id).toBe(testUsers.manager.id);
      expect(feedback.is_anonymous).toBe(1);
      expect(feedback.message).toBe('Anonymous feedback message');
    });

    test('creates manager-only feedback', () => {
      const feedback = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'Management feedback',
        false,
        'MANAGER_ONLY'
      );

      expect(feedback.visibility).toBe('MANAGER_ONLY');
      expect(feedback.author_id).toBe(testUsers.employee.id);
    });

    test('creates HR-only feedback', () => {
      const feedback = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'Sensitive HR matter',
        false,
        'HR_ONLY'
      );

      expect(feedback.visibility).toBe('HR_ONLY');
    });

    test('accepts null authorId for anonymous feedback', () => {
      const feedback = createFeedback(
        null,
        'Marketing',
        'Fully anonymous',
        true,
        'PUBLIC'
      );

      expect(feedback.author_id).toBeNull();
      expect(feedback.is_anonymous).toBe(1);
    });
  });

  describe('getFeedbackVisibleToUser', () => {
    beforeAll(() => {
      // Create test feedback with different visibility levels
      createFeedback(testUsers.employee.id, 'Engineering', 'Public feedback 1', false, 'PUBLIC');
      createFeedback(testUsers.manager.id, 'Engineering', 'Manager-only Engineering', false, 'MANAGER_ONLY');
      createFeedback(testUsers.employee.id, 'Engineering', 'HR-only Engineering', false, 'HR_ONLY');
      createFeedback(testUsers.employeeMarketing.id, 'Marketing', 'Public feedback Marketing', false, 'PUBLIC');
      createFeedback(testUsers.employeeMarketing.id, 'Marketing', 'Manager-only Marketing', false, 'MANAGER_ONLY');
    });

    test('EMPLOYEE sees only PUBLIC feedback', () => {
      const feedbacks = getFeedbackVisibleToUser(testUsers.employee);

      expect(feedbacks.every(f => f.visibility === 'PUBLIC')).toBe(true);
      expect(feedbacks.some(f => f.visibility === 'MANAGER_ONLY')).toBe(false);
      expect(feedbacks.some(f => f.visibility === 'HR_ONLY')).toBe(false);
    });

    test('MANAGER sees PUBLIC and MANAGER_ONLY for their department', () => {
      const feedbacks = getFeedbackVisibleToUser(testUsers.manager);

      const engineeringFeedback = feedbacks.filter(f => f.target_department === 'Engineering');
      const hasPublic = engineeringFeedback.some(f => f.visibility === 'PUBLIC');
      const hasManagerOnly = engineeringFeedback.some(f => f.visibility === 'MANAGER_ONLY');
      const hasHROnly = engineeringFeedback.some(f => f.visibility === 'HR_ONLY');

      expect(hasPublic).toBe(true);
      expect(hasManagerOnly).toBe(true);
      expect(hasHROnly).toBe(false);
    });

    test('MANAGER does not see MANAGER_ONLY from other departments', () => {
      const feedbacks = getFeedbackVisibleToUser(testUsers.manager);

      const marketingManagerOnly = feedbacks.filter(
        f => f.target_department === 'Marketing' && f.visibility === 'MANAGER_ONLY'
      );

      expect(marketingManagerOnly).toHaveLength(0);
    });

    test('HR_ADMIN sees all feedback regardless of visibility', () => {
      const feedbacks = getFeedbackVisibleToUser(testUsers.hrAdmin);

      const hasPublic = feedbacks.some(f => f.visibility === 'PUBLIC');
      const hasManagerOnly = feedbacks.some(f => f.visibility === 'MANAGER_ONLY');
      const hasHROnly = feedbacks.some(f => f.visibility === 'HR_ONLY');

      expect(hasPublic).toBe(true);
      expect(hasManagerOnly).toBe(true);
      expect(hasHROnly).toBe(true);
    });

    test('hides author for anonymous feedback from non-HR users', () => {
      const anonFeedback = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'Anonymous test',
        true,
        'PUBLIC'
      );

      const employeeFeedbacks = getFeedbackVisibleToUser(testUsers.employee);
      const anonFound = employeeFeedbacks.find(f => f.id === anonFeedback.id);

      expect(anonFound?.author_id).toBeNull();
      expect(anonFound?.author_name).toBeNull();
    });

    test('HR admins can see the real author of anonymous feedback', () => {
      const anonFeedback = createFeedback(
        testUsers.manager.id,
        'Engineering',
        'Truly anonymous',
        true,
        'PUBLIC'
      );

      const hrFeedbacks = getFeedbackVisibleToUser(testUsers.hrAdmin);
      const anonFound = hrFeedbacks.find(f => f.id === anonFeedback.id);

      // HR admins can always see the real author, even for anonymous feedback
      expect(anonFound?.author_id).toBe(testUsers.manager.id);
      expect(anonFound?.is_anonymous).toBe(1);
    });

    test('returns feedbacks ordered by created_at DESC', () => {
      const feedbacks = getFeedbackVisibleToUser(testUsers.hrAdmin);

      // Verify ordering: each feedback should have created_at >= next feedback
      for (let i = 0; i < feedbacks.length - 1; i++) {
        const current = new Date(feedbacks[i].created_at);
        const next = new Date(feedbacks[i + 1].created_at);
        expect(current >= next).toBe(true);
      }
    });
  });

  describe('getFeedbackById', () => {
    test('returns feedback when user has permission', () => {
      const created = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'Test feedback by ID',
        false,
        'PUBLIC'
      );

      const feedback = getFeedbackById(created.id, testUsers.manager);

      expect(feedback).toBeDefined();
      expect(feedback.id).toBe(created.id);
      expect(feedback.message).toBe('Test feedback by ID');
      expect(feedback.author_name).toBe(testUsers.employee.name);
    });

    test('throws NotFoundError when feedback does not exist', () => {
      expect(() => {
        getFeedbackById(99999, testUsers.employee);
      }).toThrow(NotFoundError);

      expect(() => {
        getFeedbackById(99999, testUsers.employee);
      }).toThrow('Feedback not found');
    });

    test('throws ForbiddenError when EMPLOYEE tries to view MANAGER_ONLY', () => {
      const managerOnly = createFeedback(
        testUsers.manager.id,
        'Engineering',
        'Manager feedback',
        false,
        'MANAGER_ONLY'
      );

      expect(() => {
        getFeedbackById(managerOnly.id, testUsers.employee);
      }).toThrow(ForbiddenError);

      expect(() => {
        getFeedbackById(managerOnly.id, testUsers.employee);
      }).toThrow('You do not have permission to view this feedback');
    });

    test('throws ForbiddenError when EMPLOYEE tries to view HR_ONLY', () => {
      const hrOnly = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'HR feedback',
        false,
        'HR_ONLY'
      );

      expect(() => {
        getFeedbackById(hrOnly.id, testUsers.employee);
      }).toThrow(ForbiddenError);
    });

    test('allows MANAGER to view MANAGER_ONLY from their department', () => {
      const managerOnly = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'For managers',
        false,
        'MANAGER_ONLY'
      );

      const feedback = getFeedbackById(managerOnly.id, testUsers.manager);

      expect(feedback.id).toBe(managerOnly.id);
      expect(feedback.visibility).toBe('MANAGER_ONLY');
    });

    test('throws ForbiddenError when MANAGER tries to view MANAGER_ONLY from other department', () => {
      const managerOnly = createFeedback(
        testUsers.employeeMarketing.id,
        'Marketing',
        'Marketing managers only',
        false,
        'MANAGER_ONLY'
      );

      expect(() => {
        getFeedbackById(managerOnly.id, testUsers.manager); // Engineering manager
      }).toThrow(ForbiddenError);
    });

    test('allows HR_ADMIN to view any feedback', () => {
      const hrOnly = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'HR only feedback',
        false,
        'HR_ONLY'
      );

      const feedback = getFeedbackById(hrOnly.id, testUsers.hrAdmin);

      expect(feedback.id).toBe(hrOnly.id);
      expect(feedback.visibility).toBe('HR_ONLY');
    });

    test('hides author for anonymous feedback from non-HR users', () => {
      const anonFeedback = createFeedback(
        testUsers.manager.id,
        'Engineering',
        'Anonymous feedback',
        true,
        'PUBLIC'
      );

      const feedback = getFeedbackById(anonFeedback.id, testUsers.employee);

      expect(feedback.author_id).toBeNull();
      expect(feedback.author_name).toBeNull();
    });

    test('HR admins can see the real author when viewing anonymous feedback', () => {
      const anonFeedback = createFeedback(
        testUsers.manager.id,
        'Engineering',
        'Truly anonymous feedback',
        true,
        'PUBLIC'
      );

      const feedback = getFeedbackById(anonFeedback.id, testUsers.hrAdmin);

      // HR admins can always see the real author, even for anonymous feedback
      expect(feedback.author_id).toBe(testUsers.manager.id);
      expect(feedback.author_name).toBe(testUsers.manager.name);
      expect(feedback.is_anonymous).toBe(1);
    });
  });

  describe('getAllFeedbackForAdmin', () => {
    test('returns all feedback with author information', () => {
      createFeedback(testUsers.employee.id, 'Engineering', 'Admin view 1', false, 'PUBLIC');
      createFeedback(testUsers.manager.id, 'Marketing', 'Admin view 2', false, 'MANAGER_ONLY');
      createFeedback(testUsers.hrAdmin.id, 'Human Resources', 'Admin view 3', false, 'HR_ONLY');

      const feedbacks = getAllFeedbackForAdmin();

      expect(feedbacks.length).toBeGreaterThanOrEqual(3);

      // Verify all visibility types are included
      const hasPublic = feedbacks.some(f => f.visibility === 'PUBLIC');
      const hasManagerOnly = feedbacks.some(f => f.visibility === 'MANAGER_ONLY');
      const hasHROnly = feedbacks.some(f => f.visibility === 'HR_ONLY');

      expect(hasPublic).toBe(true);
      expect(hasManagerOnly).toBe(true);
      expect(hasHROnly).toBe(true);
    });

    test('includes author_name for all feedback', () => {
      const feedbacks = getAllFeedbackForAdmin();

      feedbacks.forEach(f => {
        if (f.author_id !== null) {
          expect(f.author_name).toBeDefined();
        }
      });
    });

    test('anonymous feedback retains real author in admin view', () => {
      const anonFeedback = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'Anonymous in admin view',
        true,
        'PUBLIC'
      );

      const feedbacks = getAllFeedbackForAdmin();
      const found = feedbacks.find(f => f.id === anonFeedback.id);

      // getAllFeedbackForAdmin does not hide authors; HR admins can always see the real author
      expect(found?.author_id).toBe(testUsers.employee.id);
      expect(found?.author_name).toBe(testUsers.employee.name);
      expect(found?.is_anonymous).toBe(1);
    });

    test('returns feedbacks ordered by created_at DESC', () => {
      const feedbacks = getAllFeedbackForAdmin();

      // Verify ordering: each feedback should have created_at >= next feedback
      for (let i = 0; i < feedbacks.length - 1; i++) {
        const current = new Date(feedbacks[i].created_at);
        const next = new Date(feedbacks[i + 1].created_at);
        expect(current >= next).toBe(true);
      }
    });
  });

  describe('getFeedbackByDepartment', () => {
    beforeAll(() => {
      createFeedback(testUsers.employee.id, 'Engineering', 'Eng public', false, 'PUBLIC');
      createFeedback(testUsers.manager.id, 'Engineering', 'Eng manager', false, 'MANAGER_ONLY');
      createFeedback(testUsers.employeeMarketing.id, 'Marketing', 'Mkt public', false, 'PUBLIC');
      createFeedback(testUsers.managerMarketing.id, 'Marketing', 'Mkt manager', false, 'MANAGER_ONLY');
    });

    test('EMPLOYEE sees only PUBLIC feedback for department', () => {
      const feedbacks = getFeedbackByDepartment('Engineering', testUsers.employee);

      expect(feedbacks.every(f => f.target_department === 'Engineering')).toBe(true);
      expect(feedbacks.every(f => f.visibility === 'PUBLIC')).toBe(true);
    });

    test('MANAGER sees PUBLIC and MANAGER_ONLY for their own department', () => {
      const feedbacks = getFeedbackByDepartment('Engineering', testUsers.manager);

      expect(feedbacks.every(f => f.target_department === 'Engineering')).toBe(true);

      const hasPublic = feedbacks.some(f => f.visibility === 'PUBLIC');
      const hasManagerOnly = feedbacks.some(f => f.visibility === 'MANAGER_ONLY');

      expect(hasPublic).toBe(true);
      expect(hasManagerOnly).toBe(true);
    });

    test('MANAGER sees only PUBLIC for other departments', () => {
      const feedbacks = getFeedbackByDepartment('Marketing', testUsers.manager);

      expect(feedbacks.every(f => f.target_department === 'Marketing')).toBe(true);
      expect(feedbacks.every(f => f.visibility === 'PUBLIC')).toBe(true);
    });

    test('HR_ADMIN sees all feedback for department', () => {
      createFeedback(testUsers.hrAdmin.id, 'Human Resources', 'HR dept feedback', false, 'HR_ONLY');

      const feedbacks = getFeedbackByDepartment('Human Resources', testUsers.hrAdmin);

      expect(feedbacks.every(f => f.target_department === 'Human Resources')).toBe(true);
    });

    test('hides author for anonymous feedback from non-HR users', () => {
      const anonFeedback = createFeedback(
        testUsers.employee.id,
        'Engineering',
        'Anon dept test',
        true,
        'PUBLIC'
      );

      const feedbacks = getFeedbackByDepartment('Engineering', testUsers.employee);
      const found = feedbacks.find(f => f.id === anonFeedback.id);

      expect(found?.author_id).toBeNull();
      expect(found?.author_name).toBeNull();
    });

    test('HR admins can see the real author in department view', () => {
      const anonFeedback = createFeedback(
        testUsers.manager.id,
        'Engineering',
        'Anonymous in dept view',
        true,
        'PUBLIC'
      );

      const feedbacks = getFeedbackByDepartment('Engineering', testUsers.hrAdmin);
      const found = feedbacks.find(f => f.id === anonFeedback.id);

      // HR admins can always see the real author, even for anonymous feedback
      expect(found?.author_id).toBe(testUsers.manager.id);
      expect(found?.author_name).toBe(testUsers.manager.name);
      expect(found?.is_anonymous).toBe(1);
    });

    test('returns feedbacks ordered by created_at DESC', () => {
      const feedbacks = getFeedbackByDepartment('Engineering', testUsers.hrAdmin);

      // Verify ordering: each feedback should have created_at >= next feedback
      for (let i = 0; i < feedbacks.length - 1; i++) {
        const current = new Date(feedbacks[i].created_at);
        const next = new Date(feedbacks[i + 1].created_at);
        expect(current >= next).toBe(true);
      }
    });

    test('returns empty array for department with no feedback', () => {
      const feedbacks = getFeedbackByDepartment('NonExistentDepartment', testUsers.employee);

      expect(feedbacks).toEqual([]);
    });
  });
});
