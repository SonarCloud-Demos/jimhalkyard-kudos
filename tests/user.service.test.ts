import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import {
  createUser,
  getUserById,
  getUserByEmail,
  getAllUsers,
  getUsersByDepartment,
  updateUserStatus,
  toSafeUser,
  getActiveUsersByDepartment,
} from '../src/services/user.service';
import { createTestDatabase, seedTestUsers, closeTestDatabase } from './helpers/database.helper';
import { ConflictError, NotFoundError } from '../src/utils/errors';

describe('User Service', () => {
  let testUsers: any;

  beforeAll(async () => {
    createTestDatabase();
    testUsers = await seedTestUsers();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  describe('createUser', () => {
    test('creates user successfully with valid data', async () => {
      const hashedPassword = await Bun.password.hash('password123', {
        algorithm: 'argon2id',
        memoryCost: 65536,
        timeCost: 3,
      });

      const user = createUser(
        'Frank New',
        'frank@test.com',
        hashedPassword,
        'Sales',
        'EMPLOYEE'
      );

      expect(user).toBeDefined();
      expect(user.name).toBe('Frank New');
      expect(user.email).toBe('frank@test.com');
      expect(user.role).toBe('EMPLOYEE');
      expect(user.department).toBe('Sales');
      expect(user.is_active).toBe(1);
    });

    test('throws ConflictError when email already exists', async () => {
      const hashedPassword = await Bun.password.hash('password123', {
        algorithm: 'argon2id',
        memoryCost: 65536,
        timeCost: 3,
      });

      expect(() => {
        createUser(
          'Duplicate Alice',
          'alice@test.com', // Already exists
          hashedPassword,
          'Engineering',
          'EMPLOYEE'
        );
      }).toThrow(ConflictError);

      expect(() => {
        createUser(
          'Duplicate Alice',
          'alice@test.com',
          hashedPassword,
          'Engineering',
          'EMPLOYEE'
        );
      }).toThrow('Email already exists');
    });

    test('defaults to EMPLOYEE role when not specified', async () => {
      const hashedPassword = await Bun.password.hash('password123', {
        algorithm: 'argon2id',
        memoryCost: 65536,
        timeCost: 3,
      });

      const user = createUser(
        'Grace Default',
        'grace@test.com',
        hashedPassword,
        'Operations'
      );

      expect(user.role).toBe('EMPLOYEE');
    });
  });

  describe('getUserById', () => {
    test('returns user when ID exists', () => {
      const user = getUserById(testUsers.employee.id);

      expect(user).not.toBeNull();
      expect(user?.id).toBe(testUsers.employee.id);
      expect(user?.email).toBe('alice@test.com');
    });

    test('returns null when ID does not exist', () => {
      const user = getUserById(99999);

      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    test('returns user when email exists', () => {
      const user = getUserByEmail('bob@test.com');

      expect(user).not.toBeNull();
      expect(user?.id).toBe(testUsers.manager.id);
      expect(user?.name).toBe('Bob Manager');
    });

    test('returns null when email does not exist', () => {
      const user = getUserByEmail('nonexistent@test.com');

      expect(user).toBeNull();
    });

    test('email lookup is case-sensitive', () => {
      const user = getUserByEmail('ALICE@TEST.COM');

      expect(user).toBeNull();
    });
  });

  describe('getAllUsers', () => {
    test('returns all users sorted by name', () => {
      const users = getAllUsers();

      expect(users.length).toBeGreaterThanOrEqual(5);
      expect(users[0].name).toBe('Alice Employee'); // Alphabetically first

      // Verify users are sorted
      for (let i = 0; i < users.length - 1; i++) {
        expect(users[i].name.localeCompare(users[i + 1].name)).toBeLessThanOrEqual(0);
      }
    });

    test('returns safe user objects without hashed_password', () => {
      const users = getAllUsers();

      users.forEach(user => {
        expect(user).not.toHaveProperty('hashed_password');
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('department');
      });
    });
  });

  describe('getUsersByDepartment', () => {
    test('filters users by department correctly', () => {
      const engineeringUsers = getUsersByDepartment('Engineering');

      expect(engineeringUsers).toHaveLength(2);
      expect(engineeringUsers.every(u => u.department === 'Engineering')).toBe(true);
      expect(engineeringUsers.some(u => u.email === 'alice@test.com')).toBe(true);
      expect(engineeringUsers.some(u => u.email === 'bob@test.com')).toBe(true);
    });

    test('returns empty array for department with no users', () => {
      const users = getUsersByDepartment('NonExistentDept');

      expect(users).toEqual([]);
    });

    test('returns users sorted by name', () => {
      const marketingUsers = getUsersByDepartment('Marketing');

      expect(marketingUsers).toHaveLength(2);
      expect(marketingUsers[0].name).toBe('Dave Employee');
      expect(marketingUsers[1].name).toBe('Eve Manager');
    });
  });

  describe('updateUserStatus', () => {
    test('updates user status to inactive successfully', () => {
      const updatedUser = updateUserStatus(testUsers.employee.id, false);

      expect(updatedUser.is_active).toBe(0);
      expect(updatedUser.id).toBe(testUsers.employee.id);
    });

    test('updates user status to active successfully', () => {
      // First deactivate
      updateUserStatus(testUsers.manager.id, false);

      // Then reactivate
      const updatedUser = updateUserStatus(testUsers.manager.id, true);

      expect(updatedUser.is_active).toBe(1);
    });

    test('throws NotFoundError for invalid user ID', () => {
      expect(() => {
        updateUserStatus(99999, false);
      }).toThrow(NotFoundError);

      expect(() => {
        updateUserStatus(99999, false);
      }).toThrow('User not found');
    });

    test('persists status change in database', () => {
      updateUserStatus(testUsers.hrAdmin.id, false);

      const user = getUserById(testUsers.hrAdmin.id);
      expect(user?.is_active).toBe(0);
    });
  });

  describe('toSafeUser', () => {
    test('removes hashed_password from user object', () => {
      const user = getUserById(testUsers.employee.id);
      expect(user).not.toBeNull();

      const safeUser = toSafeUser(user!);

      expect(safeUser).not.toHaveProperty('hashed_password');
      expect(safeUser.id).toBe(user!.id);
      expect(safeUser.name).toBe(user!.name);
      expect(safeUser.email).toBe(user!.email);
    });

    test('preserves all other user properties', () => {
      const user = getUserById(testUsers.manager.id);
      const safeUser = toSafeUser(user!);

      expect(safeUser).toHaveProperty('id');
      expect(safeUser).toHaveProperty('name');
      expect(safeUser).toHaveProperty('email');
      expect(safeUser).toHaveProperty('role');
      expect(safeUser).toHaveProperty('department');
      expect(safeUser).toHaveProperty('is_active');
      expect(safeUser).toHaveProperty('created_at');
    });
  });

  describe('getActiveUsersByDepartment', () => {
    test('returns only active users from department', () => {
      // Deactivate one user
      updateUserStatus(testUsers.employee.id, false);

      const activeEngineering = getActiveUsersByDepartment('Engineering');

      expect(activeEngineering).toHaveLength(1);
      expect(activeEngineering[0].email).toBe('bob@test.com');
      expect(activeEngineering.every(u => u.is_active === 1)).toBe(true);
    });

    test('returns empty array when all users are inactive', () => {
      updateUserStatus(testUsers.employeeMarketing.id, false);
      updateUserStatus(testUsers.managerMarketing.id, false);

      const activeMarketing = getActiveUsersByDepartment('Marketing');

      expect(activeMarketing).toEqual([]);
    });

    test('returns all users when all are active', async () => {
      // Ensure all HR users are active
      const hrUsers = getUsersByDepartment('Human Resources');
      hrUsers.forEach(u => {
        if (u.is_active === 0) {
          updateUserStatus(u.id, true);
        }
      });

      const activeHR = getActiveUsersByDepartment('Human Resources');

      expect(activeHR.length).toBeGreaterThan(0);
      expect(activeHR.every(u => u.is_active === 1)).toBe(true);
    });

    test('filters by both department and active status', () => {
      const hashedPassword = 'test';

      // Create a new department with mixed active/inactive users
      createUser('Henry Active', 'henry@test.com', hashedPassword, 'Finance', 'EMPLOYEE');
      createUser('Irene Inactive', 'irene@test.com', hashedPassword, 'Finance', 'EMPLOYEE');

      const irene = getUserByEmail('irene@test.com');
      updateUserStatus(irene!.id, false);

      const activeFinance = getActiveUsersByDepartment('Finance');

      expect(activeFinance).toHaveLength(1);
      expect(activeFinance[0].email).toBe('henry@test.com');
    });
  });
});
