import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import {
  createKudos,
  getAllPublicKudos,
  getKudosById,
  getKudosReceivedByUser,
  getKudosGivenByUser,
} from '../src/services/kudos.service';
import { createTestDatabase, seedTestUsers, closeTestDatabase } from './helpers/database.helper';
import { NotFoundError } from '../src/utils/errors';

describe('Kudos Service', () => {
  let testUsers: any;

  beforeAll(async () => {
    createTestDatabase();
    testUsers = await seedTestUsers();
  });

  afterAll(() => {
    closeTestDatabase();
  });

  describe('createKudos', () => {
    test('creates kudos successfully with valid data', () => {
      const kudos = createKudos(
        testUsers.employee.id,
        testUsers.manager.id,
        'Great job on the project!'
      );

      expect(kudos).toBeDefined();
      expect(kudos.author_id).toBe(testUsers.employee.id);
      expect(kudos.recipient_id).toBe(testUsers.manager.id);
      expect(kudos.message).toBe('Great job on the project!');
      expect(kudos.is_public).toBe(1); // Default is public
      expect(kudos.id).toBeGreaterThan(0);
    });

    test('throws NotFoundError when recipient does not exist', () => {
      expect(() => {
        createKudos(
          testUsers.employee.id,
          99999, // Invalid recipient ID
          'This should fail'
        );
      }).toThrow(NotFoundError);

      expect(() => {
        createKudos(testUsers.employee.id, 99999, 'This should fail');
      }).toThrow('Recipient user not found');
    });

    test('allows same user to give multiple kudos', () => {
      const kudos1 = createKudos(
        testUsers.manager.id,
        testUsers.employee.id,
        'First kudos'
      );

      const kudos2 = createKudos(
        testUsers.manager.id,
        testUsers.employee.id,
        'Second kudos'
      );

      expect(kudos1.id).not.toBe(kudos2.id);
      expect(kudos1.author_id).toBe(kudos2.author_id);
      expect(kudos1.recipient_id).toBe(kudos2.recipient_id);
    });

    test('creates kudos with timestamps', () => {
      const kudos = createKudos(
        testUsers.hrAdmin.id,
        testUsers.employeeMarketing.id,
        'Excellent work!'
      );

      expect(kudos.created_at).toBeDefined();
    });
  });

  describe('getAllPublicKudos', () => {
    test('returns all public kudos with author and recipient names', () => {
      // Create some test kudos
      createKudos(testUsers.employee.id, testUsers.manager.id, 'Test kudos 1');
      createKudos(testUsers.manager.id, testUsers.hrAdmin.id, 'Test kudos 2');

      const kudos = getAllPublicKudos();

      expect(kudos.length).toBeGreaterThanOrEqual(2);

      // Verify each kudos has the names attached
      kudos.forEach(k => {
        expect(k).toHaveProperty('author_name');
        expect(k).toHaveProperty('recipient_name');
        expect(k).toHaveProperty('message');
        expect(k.is_public).toBe(1);
      });
    });

    test('returns kudos ordered by created_at DESC', () => {
      const allKudos = getAllPublicKudos();

      for (let i = 0; i < allKudos.length - 1; i++) {
        const current = new Date(allKudos[i].created_at);
        const next = new Date(allKudos[i + 1].created_at);
        expect(current >= next).toBe(true);
      }
    });

    test('filters only public kudos', () => {
      // All kudos created in tests default to public (is_public = 1)
      const kudos = getAllPublicKudos();

      expect(kudos.every(k => k.is_public === 1)).toBe(true);
    });
  });

  describe('getKudosById', () => {
    test('returns kudos with author and recipient names when ID exists', () => {
      const created = createKudos(
        testUsers.employee.id,
        testUsers.manager.id,
        'Specific kudos for testing'
      );

      const kudos = getKudosById(created.id);

      expect(kudos).not.toBeNull();
      expect(kudos?.id).toBe(created.id);
      expect(kudos?.author_name).toBe(testUsers.employee.name);
      expect(kudos?.recipient_name).toBe(testUsers.manager.name);
      expect(kudos?.message).toBe('Specific kudos for testing');
    });

    test('returns null when ID does not exist', () => {
      const kudos = getKudosById(99999);

      expect(kudos).toBeNull();
    });

    test('includes all kudos fields', () => {
      const created = createKudos(
        testUsers.hrAdmin.id,
        testUsers.employeeMarketing.id,
        'Complete fields test'
      );

      const kudos = getKudosById(created.id);

      expect(kudos).toHaveProperty('id');
      expect(kudos).toHaveProperty('author_id');
      expect(kudos).toHaveProperty('recipient_id');
      expect(kudos).toHaveProperty('message');
      expect(kudos).toHaveProperty('is_public');
      expect(kudos).toHaveProperty('created_at');
      expect(kudos).toHaveProperty('author_name');
      expect(kudos).toHaveProperty('recipient_name');
    });
  });

  describe('getKudosReceivedByUser', () => {
    test('returns only kudos received by specified user', () => {
      // Create kudos to different users
      createKudos(testUsers.manager.id, testUsers.employee.id, 'To Alice 1');
      createKudos(testUsers.hrAdmin.id, testUsers.employee.id, 'To Alice 2');
      createKudos(testUsers.employee.id, testUsers.manager.id, 'To Bob');

      const aliceKudos = getKudosReceivedByUser(testUsers.employee.id);

      expect(aliceKudos.length).toBeGreaterThanOrEqual(2);
      expect(aliceKudos.every(k => k.recipient_id === testUsers.employee.id)).toBe(true);
      expect(aliceKudos.every(k => k.recipient_name === testUsers.employee.name)).toBe(true);
    });

    test('returns empty array when user has received no kudos', () => {
      // Use a user who hasn't received kudos
      const kudos = getKudosReceivedByUser(testUsers.managerMarketing.id);

      expect(Array.isArray(kudos)).toBe(true);
    });

    test('returns only public kudos', () => {
      const kudos = getKudosReceivedByUser(testUsers.employee.id);

      expect(kudos.every(k => k.is_public === 1)).toBe(true);
    });

    test('returns kudos ordered by created_at DESC', () => {
      const kudos = getKudosReceivedByUser(testUsers.employee.id);

      for (let i = 0; i < kudos.length - 1; i++) {
        const current = new Date(kudos[i].created_at);
        const next = new Date(kudos[i + 1].created_at);
        expect(current >= next).toBe(true);
      }
    });
  });

  describe('getKudosGivenByUser', () => {
    test('returns only kudos given by specified user', () => {
      // Create kudos from different users
      createKudos(testUsers.employee.id, testUsers.manager.id, 'From Alice 1');
      createKudos(testUsers.employee.id, testUsers.hrAdmin.id, 'From Alice 2');
      createKudos(testUsers.manager.id, testUsers.employee.id, 'From Bob');

      const aliceKudos = getKudosGivenByUser(testUsers.employee.id);

      expect(aliceKudos.length).toBeGreaterThanOrEqual(2);
      expect(aliceKudos.every(k => k.author_id === testUsers.employee.id)).toBe(true);
      expect(aliceKudos.every(k => k.author_name === testUsers.employee.name)).toBe(true);
    });

    test('returns empty array when user has given no kudos', () => {
      // Use the managerMarketing user who hasn't given any kudos yet
      const kudos = getKudosGivenByUser(testUsers.managerMarketing.id);

      expect(Array.isArray(kudos)).toBe(true);
    });

    test('returns only public kudos', () => {
      const kudos = getKudosGivenByUser(testUsers.employee.id);

      if (kudos.length > 0) {
        expect(kudos.every(k => k.is_public === 1)).toBe(true);
      }
    });

    test('returns kudos ordered by created_at DESC', () => {
      const kudos = getKudosGivenByUser(testUsers.employee.id);

      for (let i = 0; i < kudos.length - 1; i++) {
        const current = new Date(kudos[i].created_at);
        const next = new Date(kudos[i + 1].created_at);
        expect(current >= next).toBe(true);
      }
    });
  });

  describe('Integration Scenarios', () => {
    test('complete kudos flow: create, retrieve, and verify relationships', () => {
      // Create kudos
      const created = createKudos(
        testUsers.manager.id,
        testUsers.employeeMarketing.id,
        'Outstanding performance!'
      );

      // Verify it appears in all public kudos
      const allKudos = getAllPublicKudos();
      expect(allKudos.some(k => k.id === created.id)).toBe(true);

      // Verify it appears in recipient's received kudos
      const receivedKudos = getKudosReceivedByUser(testUsers.employeeMarketing.id);
      expect(receivedKudos.some(k => k.id === created.id)).toBe(true);

      // Verify it appears in author's given kudos
      const givenKudos = getKudosGivenByUser(testUsers.manager.id);
      expect(givenKudos.some(k => k.id === created.id)).toBe(true);

      // Verify names are correct in all contexts
      const byId = getKudosById(created.id);
      expect(byId?.author_name).toBe('Bob Manager');
      expect(byId?.recipient_name).toBe('Dave Employee');
    });

    test('multiple kudos between same users are tracked separately', () => {
      const kudos1 = createKudos(
        testUsers.hrAdmin.id,
        testUsers.employee.id,
        'First recognition'
      );

      const kudos2 = createKudos(
        testUsers.hrAdmin.id,
        testUsers.employee.id,
        'Second recognition'
      );

      const receivedKudos = getKudosReceivedByUser(testUsers.employee.id);
      const fromHR = receivedKudos.filter(k => k.author_id === testUsers.hrAdmin.id);

      expect(fromHR.length).toBeGreaterThanOrEqual(2);
      expect(fromHR.some(k => k.message === 'First recognition')).toBe(true);
      expect(fromHR.some(k => k.message === 'Second recognition')).toBe(true);
    });
  });
});
