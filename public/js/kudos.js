let currentUser = null;
let allUsers = [];

async function loadKudos() {
  currentUser = await checkAuth();
  if (!currentUser) return;

  document.getElementById('user-name').textContent = currentUser.name;

  if (currentUser.role === 'HR_ADMIN') {
    document.getElementById('admin-link').innerHTML = '<a href="/admin">Admin</a>';
  }

  await loadUsers();
  await loadKudosFeed();
}

async function loadUsers() {
  try {
    const response = await fetch('/api/admin/users');
    if (response.ok) {
      const data = await response.json();
      allUsers = data.users.filter(u => u.id !== currentUser.id);
      populateRecipientDropdown();
    }
  } catch (error) {
    console.error('Failed to load users:', error);
  }
}

function populateRecipientDropdown() {
  const select = document.getElementById('recipient');
  select.innerHTML = '<option value="">Select a colleague...</option>';

  allUsers.forEach(user => {
    const option = document.createElement('option');
    option.value = user.id;
    option.textContent = `${user.name} (${user.department})`;
    select.appendChild(option);
  });
}

async function loadKudosFeed() {
  try {
    const response = await fetch('/api/kudos');
    const data = await response.json();

    const listDiv = document.getElementById('kudos-list');

    if (data.kudos.length === 0) {
      listDiv.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✨</div>
          <div class="empty-state-title">No kudos yet</div>
          <div class="empty-state-description">Be the first to recognize a colleague!</div>
        </div>
      `;
      return;
    }

    listDiv.innerHTML = data.kudos.map(kudos => `
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">${kudos.author_name} → ${kudos.recipient_name}</div>
            <div class="card-subtitle">${kudos.author_name} recognized ${kudos.recipient_name}</div>
          </div>
        </div>
        <div class="card-content">${kudos.message}</div>
        <div class="card-footer">
          <span>${formatDate(kudos.created_at)}</span>
        </div>
      </div>
    `).join('');
  } catch (error) {
    console.error('Failed to load kudos:', error);
    document.getElementById('kudos-list').innerHTML = `
      <div class="alert alert-error">Failed to load kudos. Please refresh the page.</div>
    `;
  }
}

function openModal() {
  document.getElementById('kudos-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('kudos-modal').classList.remove('active');
  document.getElementById('kudos-form').reset();
  document.getElementById('modal-error').innerHTML = '';
}

document.getElementById('kudos-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const recipientId = parseInt(document.getElementById('recipient').value);
  const message = document.getElementById('message').value;

  if (!recipientId) {
    showError('modal-error', 'Please select a recipient');
    return;
  }

  try {
    const response = await fetch('/api/kudos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipientId, message }),
    });

    const data = await response.json();

    if (response.ok) {
      closeModal();
      await loadKudosFeed();
    } else {
      showError('modal-error', data.error || 'Failed to submit kudos');
    }
  } catch (error) {
    showError('modal-error', 'Network error. Please try again.');
  }
});

loadKudos();
