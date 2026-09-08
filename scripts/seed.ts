import { initDatabase } from '../src/db/database';

async function seed() {
  console.log('Starting database seed...');

  const db = initDatabase();

  // Clear existing data
  db.run('DELETE FROM feedback_posts');
  db.run('DELETE FROM kudos_posts');
  db.run('DELETE FROM users');

  // Hash passwords using Bun's password API
  const employeePassword = await Bun.password.hash('employee123', {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  const managerPassword = await Bun.password.hash('manager123', {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  const hrAdminPassword = await Bun.password.hash('hradmin123', {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  // Insert sample users
  const insertUser = db.prepare(
    'INSERT INTO users (name, email, hashed_password, role, department) VALUES (?, ?, ?, ?, ?)'
  );

  // Employee user
  insertUser.run(
    'Alice Johnson',
    'alice@company.com',
    employeePassword,
    'EMPLOYEE',
    'Engineering'
  );

  // Additional employees for different departments
  insertUser.run(
    'Bob Smith',
    'bob@company.com',
    employeePassword,
    'EMPLOYEE',
    'Engineering'
  );

  insertUser.run(
    'Charlie Davis',
    'charlie@company.com',
    employeePassword,
    'EMPLOYEE',
    'Marketing'
  );

  // Manager user
  insertUser.run(
    'Diana Wilson',
    'diana@company.com',
    managerPassword,
    'MANAGER',
    'Engineering'
  );

  insertUser.run(
    'Eve Martinez',
    'eve@company.com',
    managerPassword,
    'MANAGER',
    'Marketing'
  );

  // HR Admin user
  insertUser.run(
    'Frank Brown',
    'frank@company.com',
    hrAdminPassword,
    'HR_ADMIN',
    'Human Resources'
  );

  console.log('✓ Sample users created');

  // Insert sample kudos posts
  const insertKudos = db.prepare(
    'INSERT INTO kudos_posts (author_id, recipient_id, message) VALUES (?, ?, ?)'
  );

  insertKudos.run(
    1,
    2,
    'Great job on the new feature release! Your attention to detail made all the difference.'
  );

  insertKudos.run(
    2,
    1,
    'Thanks for helping me debug that tricky issue yesterday. Much appreciated!'
  );

  insertKudos.run(
    4,
    1,
    'Outstanding work on the project presentation. Well done!'
  );

  console.log('✓ Sample kudos posts created');

  // Insert sample feedback posts
  const insertFeedback = db.prepare(
    'INSERT INTO feedback_posts (author_id, target_department, message, is_anonymous, visibility) VALUES (?, ?, ?, ?, ?)'
  );

  // Public feedback
  insertFeedback.run(
    1,
    'Engineering',
    'The new development tools have significantly improved our productivity.',
    0,
    'PUBLIC'
  );

  // Manager-only feedback
  insertFeedback.run(
    2,
    'Engineering',
    'We need better code review processes. Some PRs are sitting for days without feedback.',
    0,
    'MANAGER_ONLY'
  );

  // Anonymous feedback
  insertFeedback.run(
    1,
    'Engineering',
    'The on-call rotation is too heavy. We need more people in the rotation.',
    1,
    'MANAGER_ONLY'
  );

  // HR-only feedback
  insertFeedback.run(
    3,
    'Marketing',
    'There are concerns about work-life balance in the Marketing department.',
    0,
    'HR_ONLY'
  );

  // Anonymous complaint to HR
  insertFeedback.run(
    null,
    'Human Resources',
    'There have been some unprofessional behaviors in team meetings that need to be addressed.',
    1,
    'HR_ONLY'
  );

  console.log('✓ Sample feedback posts created');

  console.log('\n✅ Database seeded successfully!\n');
  console.log('Sample credentials:');
  console.log('  Employee: alice@company.com / employee123');
  console.log('  Manager:  diana@company.com / manager123');
  console.log('  HR Admin: frank@company.com / hradmin123');
  console.log('');

  db.close();
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
