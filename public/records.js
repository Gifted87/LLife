// Lagos Life - Admin Records Dashboard Controller

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Admin Gate
  const adminGateWrapper = document.getElementById('adminGateWrapper');
  const adminLoginForm = document.getElementById('adminLoginForm');
  const adminPassInput = document.getElementById('adminPassInput');
  const adminPassToggle = document.getElementById('adminPassToggle');
  const adminUnlockBtn = document.getElementById('adminUnlockBtn');
  const adminLogoutBtn = document.getElementById('adminLogoutBtn');
  const adminDashboardContent = document.getElementById('adminDashboardContent');

  // DOM Elements - Dashboard
  const recordsTableBody = document.getElementById('recordsTableBody');
  const tableWrapper = document.getElementById('tableWrapper');
  const emptyState = document.getElementById('emptyState');
  const emptyTitle = document.getElementById('emptyTitle');
  const emptySub = document.getElementById('emptySub');
  const searchInput = document.getElementById('searchInput');
  const refreshBtn = document.getElementById('refreshBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const toast = document.getElementById('toast');

  // KPI elements
  const kpiTotalCount = document.getElementById('kpiTotalCount');
  const kpiFilteredSub = document.getElementById('kpiFilteredSub');
  const kpiLatestUser = document.getElementById('kpiLatestUser');
  const kpiLatestTime = document.getElementById('kpiLatestTime');

  let allRecords = [];
  let toastTimeout = null;

  // Determine API base URLs
  function getApiBaseUrl() {
    if (window.location.port === '8000' && window.location.hostname === 'localhost') {
      return 'http://localhost:3001/api/records';
    }
    return '/api/records';
  }

  function getAuthApiUrl() {
    if (window.location.port === '8000' && window.location.hostname === 'localhost') {
      return 'http://localhost:3001/api/admin-auth';
    }
    return '/api/admin-auth';
  }

  // Toast notification helper
  function showToast(message, type = 'info') {
    if (toastTimeout) clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Authentication State Management
  function getAdminToken() {
    return sessionStorage.getItem('llife_admin_token') || '';
  }

  function setAdminToken(token) {
    if (token) {
      sessionStorage.setItem('llife_admin_token', token);
    } else {
      sessionStorage.removeItem('llife_admin_token');
    }
  }

  function showGate() {
    adminGateWrapper.style.display = 'flex';
    adminDashboardContent.style.display = 'none';
    adminLogoutBtn.style.display = 'none';
    if (adminPassInput) {
      adminPassInput.value = '';
      setTimeout(() => adminPassInput.focus(), 100);
    }
  }

  function showDashboard() {
    adminGateWrapper.style.display = 'none';
    adminDashboardContent.style.display = 'flex';
    adminLogoutBtn.style.display = 'inline-flex';
    fetchRecords(false);
  }

  // Handle Admin Login submission
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = adminPassInput.value.trim();
      if (!password) {
        showToast('Please enter the admin password', 'info');
        return;
      }

      adminUnlockBtn.disabled = true;
      adminUnlockBtn.textContent = 'Verifying...';

      try {
        const res = await fetch(getAuthApiUrl(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        const data = await res.json();

        if (res.ok && data.success && data.token) {
          setAdminToken(data.token);
          showToast('Welcome, Administrator!', 'success');
          showDashboard();
        } else {
          showToast(data.error || 'Invalid admin password.', 'error');
          adminPassInput.select();
        }
      } catch (err) {
        console.error('Auth error:', err);
        showToast('Connection error. Ensure backend server is running.', 'error');
      } finally {
        adminUnlockBtn.disabled = false;
        adminUnlockBtn.textContent = 'Unlock Admin Dashboard';
      }
    });
  }

  // Admin Logout / Lock
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener('click', () => {
      setAdminToken('');
      showToast('Admin session locked.', 'info');
      showGate();
    });
  }

  // Toggle Password in Admin Gate
  if (adminPassToggle && adminPassInput) {
    adminPassToggle.addEventListener('click', () => {
      if (adminPassInput.type === 'password') {
        adminPassInput.type = 'text';
        adminPassToggle.innerHTML = `
          <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
      } else {
        adminPassInput.type = 'password';
        adminPassToggle.innerHTML = `
          <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
      }
    });
  }

  // Format relative time
  function formatTime(dateString) {
    if (!dateString) return 'Just now';
    try {
      const date = new Date(dateString.replace(' ', 'T') + 'Z');
      if (isNaN(date.getTime())) return dateString;
      
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);

      if (diffSec < 60) return 'Just now';
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  }

  // Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Fetch records from backend SQLite (with Auth Bearer token)
  async function fetchRecords(isUserAction = false) {
    const token = getAdminToken();
    if (!token) {
      showGate();
      return;
    }

    if (refreshBtn) refreshBtn.classList.add('spinning');

    try {
      const response = await fetch(getApiBaseUrl(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setAdminToken('');
        showToast('Admin session expired. Please re-enter password.', 'error');
        showGate();
        return;
      }

      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();

      allRecords = data.records || [];
      renderRecords();
      updateKpis();

      if (isUserAction) {
        showToast(`Loaded ${allRecords.length} records from database.`, 'success');
      }
    } catch (err) {
      console.error('Failed to load records:', err);
      showToast('Could not connect to database server.', 'error');
      renderEmptyState('Connection Error', 'Unable to reach backend SQLite server.');
    } finally {
      if (refreshBtn) {
        setTimeout(() => refreshBtn.classList.remove('spinning'), 400);
      }
    }
  }

  // Render Table Rows
  function renderRecords() {
    const query = searchInput.value.trim().toLowerCase();
    const filtered = allRecords.filter(r => {
      if (!query) return true;
      const idMatch = String(r.id).includes(query);
      const input1Match = String(r.input1 || '').toLowerCase().includes(query);
      const input2Match = String(r.input2 || '').toLowerCase().includes(query);
      return idMatch || input1Match || input2Match;
    });

    if (filtered.length === 0) {
      if (query) {
        renderEmptyState('No matches found', `No records match "${query}".`);
      } else {
        renderEmptyState('No records stored yet', 'Submit the login form to save records into the SQLite database.');
      }
      return;
    }

    emptyState.style.display = 'none';
    tableWrapper.style.display = 'block';

    recordsTableBody.innerHTML = filtered.map(record => {
      const initial = (record.input1 || '?').charAt(0).toUpperCase();
      const safeUser = escapeHtml(record.input1);
      const safePass = escapeHtml(record.input2);
      const formattedDate = record.created_at || 'N/A';
      const relTime = formatTime(record.created_at);

      return `
        <tr data-id="${record.id}">
          <td>
            <span class="id-badge">#${record.id}</span>
          </td>
          <td>
            <div class="user-cell">
              <div class="user-avatar">${initial}</div>
              <span class="user-text">${safeUser}</span>
            </div>
          </td>
          <td>
            <div class="pass-wrapper">
              <span class="pass-text" data-revealed="false" data-raw="${safePass}">••••••••</span>
              <button type="button" class="btn-icon-subtle toggle-pass-btn" aria-label="Toggle password" title="Show/Hide">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button type="button" class="btn-icon-subtle copy-pass-btn" aria-label="Copy password" title="Copy to clipboard">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </td>
          <td>
            <span class="date-text" title="${formattedDate}">${relTime}</span>
          </td>
          <td style="text-align: right;">
            <button type="button" class="btn-icon-subtle btn-delete-row" data-id="${record.id}" title="Delete record #${record.id}">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    attachRowListeners();
  }

  // Render empty state
  function renderEmptyState(title, sub) {
    tableWrapper.style.display = 'none';
    emptyState.style.display = 'flex';
    emptyTitle.textContent = title;
    emptySub.textContent = sub;
  }

  // Attach interactive button listeners on rendered rows
  function attachRowListeners() {
    // Password visibility toggle
    document.querySelectorAll('.toggle-pass-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const wrapper = btn.closest('.pass-wrapper');
        const passText = wrapper.querySelector('.pass-text');
        const isRevealed = passText.getAttribute('data-revealed') === 'true';

        if (isRevealed) {
          passText.textContent = '••••••••';
          passText.setAttribute('data-revealed', 'false');
          btn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          `;
        } else {
          passText.textContent = passText.getAttribute('data-raw');
          passText.setAttribute('data-revealed', 'true');
          btn.innerHTML = `
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
              <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
          `;
        }
      });
    });

    // Copy password button
    document.querySelectorAll('.copy-pass-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const wrapper = btn.closest('.pass-wrapper');
        const rawPass = wrapper.querySelector('.pass-text').getAttribute('data-raw');
        try {
          await navigator.clipboard.writeText(rawPass);
          showToast('Password copied to clipboard!', 'info');
        } catch {
          showToast('Could not access clipboard.', 'error');
        }
      });
    });

    // Delete single record button
    document.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const token = getAdminToken();
        if (!confirm(`Are you sure you want to delete record #${id}?`)) return;

        try {
          const deleteUrl = `${getApiBaseUrl()}/${id}`;
          const res = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await res.json();

          if (res.ok && data.success) {
            allRecords = allRecords.filter(r => String(r.id) !== String(id));
            renderRecords();
            updateKpis();
            showToast(`Record #${id} deleted.`, 'info');
          } else {
            showToast(data.error || 'Failed to delete record.', 'error');
          }
        } catch (err) {
          showToast('Network error deleting record.', 'error');
        }
      });
    });
  }

  // Update KPI counters
  function updateKpis() {
    kpiTotalCount.textContent = allRecords.length;

    if (allRecords.length > 0) {
      const latest = allRecords[0];
      kpiLatestUser.textContent = latest.input1 || 'User';
      kpiLatestTime.textContent = formatTime(latest.created_at);
      kpiFilteredSub.textContent = 'Active database rows';
    } else {
      kpiLatestUser.textContent = '—';
      kpiLatestTime.textContent = 'No records yet';
      kpiFilteredSub.textContent = 'Database empty';
    }
  }

  // Delete All Records
  clearAllBtn.addEventListener('click', async () => {
    const token = getAdminToken();
    if (allRecords.length === 0) {
      showToast('Database is already empty.', 'info');
      return;
    }

    if (!confirm('⚠️ Are you sure you want to clear ALL records from the database? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(getApiBaseUrl(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok && data.success) {
        allRecords = [];
        renderRecords();
        updateKpis();
        showToast('All database records cleared.', 'info');
      } else {
        showToast(data.error || 'Failed to clear records.', 'error');
      }
    } catch {
      showToast('Error communicating with server.', 'error');
    }
  });

  // Search input event
  searchInput.addEventListener('input', () => {
    renderRecords();
  });

  // Refresh button event
  refreshBtn.addEventListener('click', () => {
    fetchRecords(true);
  });

  // Check initial authentication
  if (getAdminToken()) {
    showDashboard();
  } else {
    showGate();
  }
});
