import { getDatabase } from '../db/database';
import type { KudosPost, KudosPostWithNames } from '../models/types';
import { NotFoundError } from '../utils/errors';
import { getUserById } from './user.service';

export function createKudos(
  authorId: number,
  recipientId: number,
  message: string
): KudosPost {
  const db = getDatabase();

  const recipient = getUserById(recipientId);
  if (!recipient) {
    throw new NotFoundError('Recipient user not found');
  }

  const stmt = db.prepare(
    'INSERT INTO kudos_posts (author_id, recipient_id, message) VALUES (?, ?, ?)'
  );

  const result = stmt.run(authorId, recipientId, message);

  const kudos = db
    .prepare('SELECT * FROM kudos_posts WHERE id = ?')
    .get(result.lastInsertRowid) as KudosPost;

  return kudos;
}

export function getAllPublicKudos(): KudosPostWithNames[] {
  const db = getDatabase();

  const kudos = db
    .prepare(
      `SELECT
        k.*,
        a.name as author_name,
        r.name as recipient_name
      FROM kudos_posts k
      JOIN users a ON k.author_id = a.id
      JOIN users r ON k.recipient_id = r.id
      WHERE k.is_public = 1
      ORDER BY k.created_at DESC`
    )
    .all() as KudosPostWithNames[];

  return kudos;
}

export function getKudosById(id: number): KudosPostWithNames | null {
  const db = getDatabase();

  const kudos = db
    .prepare(
      `SELECT
        k.*,
        a.name as author_name,
        r.name as recipient_name
      FROM kudos_posts k
      JOIN users a ON k.author_id = a.id
      JOIN users r ON k.recipient_id = r.id
      WHERE k.id = ?`
    )
    .get(id) as KudosPostWithNames | undefined;

  return kudos || null;
}

export function getKudosReceivedByUser(userId: number): KudosPostWithNames[] {
  const db = getDatabase();

  const kudos = db
    .prepare(
      `SELECT
        k.*,
        a.name as author_name,
        r.name as recipient_name
      FROM kudos_posts k
      JOIN users a ON k.author_id = a.id
      JOIN users r ON k.recipient_id = r.id
      WHERE k.recipient_id = ? AND k.is_public = 1
      ORDER BY k.created_at DESC`
    )
    .all(userId) as KudosPostWithNames[];

  return kudos;
}

export function getKudosGivenByUser(userId: number): KudosPostWithNames[] {
  const db = getDatabase();

  const kudos = db
    .prepare(
      `SELECT
        k.*,
        a.name as author_name,
        r.name as recipient_name
      FROM kudos_posts k
      JOIN users a ON k.author_id = a.id
      JOIN users r ON k.recipient_id = r.id
      WHERE k.author_id = ? AND k.is_public = 1
      ORDER BY k.created_at DESC`
    )
    .all(userId) as KudosPostWithNames[];

  return kudos;
}
