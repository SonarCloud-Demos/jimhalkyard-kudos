import { Database } from 'bun:sqlite';
import { readFileSync } from 'fs';
import { join } from 'path';

let db: Database | null = null;

const IMAGE_TABLES = ['kudos_posts', 'feedback_posts'];

// Databases created before image uploads existed lack the image_path column.
function addMissingImageColumns(database: Database): void {
  for (const table of IMAGE_TABLES) {
    const columns = database.query(`PRAGMA table_info(${table})`).all() as { name: string }[];

    if (!columns.some((column) => column.name === 'image_path')) {
      database.exec(`ALTER TABLE ${table} ADD COLUMN image_path TEXT`);
    }
  }
}

export function initDatabase(path: string = process.env.DATABASE_PATH || './kudos.db'): Database {
  if (db) {
    return db;
  }

  db = new Database(path);
  db.exec('PRAGMA foreign_keys = ON;');

  const schema = readFileSync(join(import.meta.dir, 'schema.sql'), 'utf-8');
  db.exec(schema);
  addMissingImageColumns(db);

  console.info(`Database initialized at ${path}`);
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
    console.info('Database connection closed');
  }
}
