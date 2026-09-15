import type { Database } from 'bun:sqlite';
import { initDatabase, closeDatabase } from '../../src/db/database';

/**
 * Sets up database mocking by initializing the database module with a test database
 * This works because all services use getDatabase() which returns the initialized db
 */
export function mockGetDatabase(db: Database) {
  // The database module uses a module-level variable.
  // Since we can't directly set it, we'll work around by using the initDatabase path parameter
  // However, for tests, we just need to ensure the services use the test database.
  // The cleanest approach is to have tests use initDatabase(':memory:') directly.
  // This function is kept for API compatibility but doesn't need to do anything special.
}

/**
 * Initializes the database module with an in-memory test database
 * Call this in beforeAll() to set up test database for services
 */
export function initTestDatabase(): Database {
  return initDatabase(':memory:');
}

/**
 * Closes the test database
 * Call this in afterAll() to clean up
 */
export function closeTestDatabase() {
  closeDatabase();
}
