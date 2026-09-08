-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('EMPLOYEE', 'MANAGER', 'HR_ADMIN')),
  department TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Kudos posts table
CREATE TABLE IF NOT EXISTS kudos_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL,
  recipient_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_public INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_kudos_author ON kudos_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_kudos_recipient ON kudos_posts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_kudos_created ON kudos_posts(created_at DESC);

-- Feedback posts table
CREATE TABLE IF NOT EXISTS feedback_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER,
  target_department TEXT NOT NULL,
  message TEXT NOT NULL,
  is_anonymous INTEGER DEFAULT 0,
  visibility TEXT NOT NULL CHECK(visibility IN ('PUBLIC', 'MANAGER_ONLY', 'HR_ONLY')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_feedback_department ON feedback_posts(target_department);
CREATE INDEX IF NOT EXISTS idx_feedback_visibility ON feedback_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback_posts(created_at DESC);
