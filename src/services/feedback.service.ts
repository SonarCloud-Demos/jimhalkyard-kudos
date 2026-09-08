import { getDatabase } from '../db/database';
import type { FeedbackPost, FeedbackPostWithAuthor, User, FeedbackVisibility } from '../models/types';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { canViewFeedback, shouldHideAuthor } from './auth.service';

export function createFeedback(
  authorId: number | null,
  targetDepartment: string,
  message: string,
  isAnonymous: boolean,
  visibility: FeedbackVisibility
): FeedbackPost {
  const db = getDatabase();

  const actualAuthorId = isAnonymous ? null : authorId;

  const stmt = db.prepare(
    'INSERT INTO feedback_posts (author_id, target_department, message, is_anonymous, visibility) VALUES (?, ?, ?, ?, ?)'
  );

  const result = stmt.run(
    actualAuthorId,
    targetDepartment,
    message,
    isAnonymous ? 1 : 0,
    visibility
  );

  const feedback = db
    .prepare('SELECT * FROM feedback_posts WHERE id = ?')
    .get(result.lastInsertRowid) as FeedbackPost;

  return feedback;
}

export function getFeedbackVisibleToUser(user: User): FeedbackPostWithAuthor[] {
  const db = getDatabase();

  let query = `
    SELECT
      f.*,
      u.name as author_name
    FROM feedback_posts f
    LEFT JOIN users u ON f.author_id = u.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (user.role === 'HR_ADMIN') {
    // HR admins see everything
    query += ' ORDER BY f.created_at DESC';
  } else if (user.role === 'MANAGER') {
    // Managers see PUBLIC + MANAGER_ONLY for their department
    query += ` AND (
      f.visibility = 'PUBLIC'
      OR (f.visibility = 'MANAGER_ONLY' AND f.target_department = ?)
    ) ORDER BY f.created_at DESC`;
    params.push(user.department);
  } else {
    // Employees see only PUBLIC
    query += ` AND f.visibility = 'PUBLIC' ORDER BY f.created_at DESC`;
  }

  const feedbacks = db.prepare(query).all(...params) as FeedbackPostWithAuthor[];

  // Hide author information for anonymous feedback (except for HR admins)
  return feedbacks.map((feedback) => {
    if (shouldHideAuthor(user, feedback)) {
      return {
        ...feedback,
        author_id: null,
        author_name: null,
      };
    }
    return feedback;
  });
}

export function getFeedbackById(id: number, user: User): FeedbackPostWithAuthor {
  const db = getDatabase();

  const feedback = db
    .prepare(
      `SELECT
        f.*,
        u.name as author_name
      FROM feedback_posts f
      LEFT JOIN users u ON f.author_id = u.id
      WHERE f.id = ?`
    )
    .get(id) as FeedbackPostWithAuthor | undefined;

  if (!feedback) {
    throw new NotFoundError('Feedback not found');
  }

  // Check if user can view this feedback
  if (!canViewFeedback(user, feedback)) {
    throw new ForbiddenError('You do not have permission to view this feedback');
  }

  // Hide author information if necessary
  if (shouldHideAuthor(user, feedback)) {
    feedback.author_id = null;
    feedback.author_name = null;
  }

  return feedback;
}

export function getAllFeedbackForAdmin(): FeedbackPostWithAuthor[] {
  const db = getDatabase();

  const feedbacks = db
    .prepare(
      `SELECT
        f.*,
        u.name as author_name
      FROM feedback_posts f
      LEFT JOIN users u ON f.author_id = u.id
      ORDER BY f.created_at DESC`
    )
    .all() as FeedbackPostWithAuthor[];

  return feedbacks;
}

export function getFeedbackByDepartment(
  department: string,
  user: User
): FeedbackPostWithAuthor[] {
  const db = getDatabase();

  let query = `
    SELECT
      f.*,
      u.name as author_name
    FROM feedback_posts f
    LEFT JOIN users u ON f.author_id = u.id
    WHERE f.target_department = ?
  `;
  const params: any[] = [department];

  if (user.role === 'HR_ADMIN') {
    // HR admins see everything for the department
    query += ' ORDER BY f.created_at DESC';
  } else if (user.role === 'MANAGER') {
    // Managers see PUBLIC + MANAGER_ONLY for their own department
    if (user.department !== department) {
      // Can't see other departments' manager-only feedback
      query += ` AND f.visibility = 'PUBLIC' ORDER BY f.created_at DESC`;
    } else {
      query += ` AND (f.visibility = 'PUBLIC' OR f.visibility = 'MANAGER_ONLY') ORDER BY f.created_at DESC`;
    }
  } else {
    // Employees see only PUBLIC
    query += ` AND f.visibility = 'PUBLIC' ORDER BY f.created_at DESC`;
  }

  const feedbacks = db.prepare(query).all(...params) as FeedbackPostWithAuthor[];

  // Hide author information for anonymous feedback (except for HR admins)
  return feedbacks.map((feedback) => {
    if (shouldHideAuthor(user, feedback)) {
      return {
        ...feedback,
        author_id: null,
        author_name: null,
      };
    }
    return feedback;
  });
}
