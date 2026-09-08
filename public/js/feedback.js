let currentUser = null;

async function loadFeedback() {
  currentUser = await checkAuth();
  if (!currentUser) return;

  document.getElementById('user-name').textContent = currentUser.name;

  if (currentUser.role === 'HR_ADMIN') {
    document.getElementById('admin-link').innerHTML = '<a href="/admin">Admin</a>';
  }

  await loadFeedbackList();
}

async function loadFeedbackList() {
  try {
    const response = await fetch('/api/feedback');
    const data = await response.json();

    const listDiv = document.getElementById('feedback-list');

    if (data.feedback.length === 0) {
      listDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">💬</div>
          <div class="empty-state-title">No feedback yet</div>
          <div class="empty-state-description">Be the first to submit feedback!</div>
        </div>
      `;
      return;
    }

    listDiv.innerHTML = data.feedback.map(feedback => {
      const visibilityBadge = getVisibilityBadge(feedback.visibility);
      const authorName = feedback.author_name || 'Anonymous';

      return `
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">${feedback.target_department} Department</div>
              <div class="card-subtitle">
                From: ${authorName}
                ${feedback.is_anonymous ? '<em>(submitted anonymously)</em>' : ''}
              </div>
            </div>
            ${visibilityBadge}
          </div>
          <div class="card-content">${feedback.message}</div>
          <div class="card-footer">
            <span>${formatDate(feedback.created_at)}</span>
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

function openModal() {
  document.getElementById('feedback-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('feedback-modal').classList.remove('active');
  document.getElementById('feedback-form').reset();
  document.getElementById('modal-error').innerHTML = '';
}

document.getElementById('feedback-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const targetDepartment = document.getElementById('target-department').value;
  const message = document.getElementById('message').value;
  const isAnonymous = document.getElementById('is-anonymous').checked;
  const visibility = document.querySelector('input[name="visibility"]:checked')?.value;

  if (!visibility) {
    showError('modal-error', 'Please select a visibility level');
    return;
  }

  try {
    const response = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetDepartment,
        message,
        isAnonymous,
        visibility,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      closeModal();
      await loadFeedbackList();
    } else {
      showError('modal-error', data.error || 'Failed to submit feedback');
    }
  } catch (error) {
    showError('modal-error', 'Network error. Please try again.');
  }
});

loadFeedback();
