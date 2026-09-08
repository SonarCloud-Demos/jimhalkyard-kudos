import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

let db: Database | null = null;

export function initDatabase(path: string = process.env.DATABASE_PATH || './kudos.db'): Database {
  if (db) {
    return db;
  }

  db = new Database(path);
  db.exec('PRAGMA foreign_keys = ON;');

  const schema = readFileSync(join(import.meta.dir, 'schema.sql'), 'utf-8');
  db.exec(schema);

  console.log(`Database initialized at ${path}`);
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}
