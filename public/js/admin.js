let currentUser = null;

async function loadAdmin() {
  currentUser = await checkAuth();
  if (!currentUser) return;

  if (currentUser.role !== 'HR_ADMIN') {
    alert('Access denied. HR Admin role required.');
    window.location.href = '/dashboard';
    return;
  }

  document.getElementById('user-name').textContent = currentUser.name;

  await loadUsers();
  await loadAllFeedback();
}

async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users');
    const data = await response.json();

    const tableDiv = document.getElementById('users-table');

    if (data.users.length === 0) {
      tableDiv.innerHTML = '<p>No users found.</p>';
      return;
    }

    tableDiv.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${data.users.map(user => `
            <tr>
              <td>${user.name}</td>
              <td>${user.email}</td>
              <td>${user.role.replace('_', ' ')}</td>
              <td>${user.department}</td>
              <td>
                <span class="badge ${user.is_active ? 'badge-public' : 'badge-hr'}">
                  ${user.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                ${user.id === currentUser.id
                  ? '<em>You</em>'
                  : user.is_active
                    ? `<button class="button button-error" onclick="toggleUserStatus(${user.id}, false)">Deactivate</button>`
                    : `<button class="button button-success" onclick="toggleUserStatus(${user.id}, true)">Activate</button>`
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (error) {
    console.error('Failed to load users:', error);
    document.getElementById('users-table').innerHTML = `
      <div class="alert alert-error">Failed to load users. Please refresh the page.</div>
    `;
  }
}

async function toggleUserStatus(userId, isActive) {
  const action = isActive ? 'activate' : 'deactivate';
  if (!confirm(`Are you sure you want to ${action} this user?`)) {
    return;
  }

  try {
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    });

    if (response.ok) {
      await loadUsers();
    } else {
      const data = await response.json();
      alert(data.error || `Failed to ${action} user`);
    }
  } catch (error) {
    alert('Network error. Please try again.');
  }
}

async function loadAllFeedback() {
  try {
    const response = await fetch('/api/admin/feedback/all');
    const data = await response.json();

    const listDiv = document.getElementById('feedback-list');

    if (data.feedback.length === 0) {
      listDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">No feedback yet</div>
        </div>
      `;
      return;
    }

    listDiv.innerHTML = data.feedback.map(feedback => {
      const visibilityBadge = getVisibilityBadge(feedback.visibility);
      const authorName = feedback.author_name || 'Anonymous (No author)';
      const authorInfo = feedback.is_anonymous
        ? `<em>Submitted anonymously by ${feedback.author_name || 'deleted user'}</em>`
        : authorName;

      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">${feedback.target_department} Department</div>
              <div class="card-subtitle">From: ${authorInfo}</div>
            </div>
            ${visibilityBadge}
          </div>
          <div class="card-content">${feedback.message}</div>
          <div class="card-footer">
            <span>${formatDate(feedback.created_at)}</span>
            ${feedback.is_anonymous ? '<span class="badge badge-hr">Anonymous</span>' : ''}
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Failed to load feedback:', error);
    document.getElementById('feedback-list').innerHTML = `
      <div class="alert alert-error">Failed to load feedback. Please refresh the page.</div>
    `;
  }
}

function getVisibilityBadge(visibility) {
  const badges = {
    'PUBLIC': '<span class="badge badge-public">Public</span>',
    'MANAGER_ONLY': '<span class="badge badge-manager">Manager Only</span>',
    'HR_ONLY': '<span class="badge badge-hr">HR Only</span>',
  };
  return badges[visibility] || '';
}

loadAdmin();
