window.AuraCare = window.AuraCare || {};

AuraCare.App = (function() {
  // Routes mapping hash to View Renderers
  const ROUTES = {
    '#dashboard': AuraCare.Views.Dashboard,
    '#patients': AuraCare.Views.Patients,
    '#staff': AuraCare.Views.Staff,
    '#resources': AuraCare.Views.Resources,
    '#lab': AuraCare.Views.Lab,
    '#appointments': AuraCare.Views.Appointments,
    '#billing': AuraCare.Views.Billing
  };

  let currentHash = '#dashboard';
  const DOCTOR_ROUTES = ['#dashboard', '#patients', '#staff', '#lab'];

  async function init() {
    // 1. Initialize local storage seed data
    await AuraCare.Store.init();

    // 2. Setup route change listener
    window.addEventListener('hashchange', handleRouteChange);

    // 3. Setup authentication gateway checks
    checkAuth();

    // 4. Setup global layout events (Sidebar triggers, mobile overlay toggles, logouts, drawer toggles)
    setupGlobalEvents();

    // 5. Reactive Store subscriptions
    AuraCare.Store.subscribe('all', () => {
      if (isLoggedIn()) {
        renderActiveView();
        updateGlobalPanels();
      }
    });
  }

  function isLoggedIn() {
    return sessionStorage.getItem('auracare_active_user') !== null;
  }

  function getActiveUser() {
    const userJson = sessionStorage.getItem('auracare_active_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  function getActiveRole() {
    return (getActiveUser()?.role || 'doctor').toLowerCase();
  }

  function isRouteAllowed(hash) {
    return getActiveRole() === 'admin' || DOCTOR_ROUTES.includes(hash);
  }

  function checkAuth() {
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');

    if (isLoggedIn()) {
      authContainer.classList.add('hidden');
      appContainer.classList.remove('hidden');
      
      // Update user details in sidebar
      updateSidebarUserData();
      applyRoleNavigation();
      
      // Load current route
      handleRouteChange();
      
      // Draw global telemetry sidebars
      updateGlobalPanels();
    } else {
      authContainer.classList.remove('hidden');
      appContainer.classList.add('hidden');
      
      window.location.hash = '#dashboard';
      
      // Wire auth forms
      setupAuthForms();
    }
  }

  function updateSidebarUserData() {
    const userJson = sessionStorage.getItem('auracare_active_user');
    if (!userJson) return;

    const user = JSON.parse(userJson);
    const nameEl = document.getElementById('sidebar-user-name');
    const avatarEl = document.getElementById('sidebar-avatar');
    const roleEl = document.getElementById('sidebar-user-role');
    const roleBadge = document.getElementById('sidebar-role-badge');

    if (nameEl) nameEl.textContent = user.name;
    const roleLabel = user.role === 'admin' ? 'Hospital Admin' : 'Doctor';
    if (roleEl) roleEl.textContent = roleLabel;
    if (roleBadge) roleBadge.textContent = user.role === 'admin' ? 'ADMIN' : 'DOCTOR';
    
    if (avatarEl) {
      const names = user.name.trim().split(' ');
      let initials = 'ST';
      if (names.length >= 2) {
        if (names[0].toLowerCase().includes('dr') && names.length > 2) {
          initials = (names[1].substring(0, 1) + names[2].substring(0, 1)).toUpperCase();
        } else {
          initials = (names[0].substring(0, 1) + names[1].substring(0, 1)).toUpperCase();
        }
      } else if (names.length === 1) {
        initials = names[0].substring(0, 2).toUpperCase();
      }
      avatarEl.textContent = initials;
    }
  }

  function applyRoleNavigation() {
    const role = getActiveRole();
    document.querySelectorAll('.nav-item').forEach(item => {
      const href = item.getAttribute('href');
      item.classList.toggle('hidden', role === 'doctor' && !DOCTOR_ROUTES.includes(href));
    });
  }

  function clearErrors() {
    document.querySelectorAll('.error-text').forEach(el => {
      el.textContent = '';
      el.classList.add('hidden');
    });
  }

  function showFieldError(elementId, msg) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }

  function setupAuthForms() {
    const loginSection = document.getElementById('login-form-section');
    const loginForm = document.getElementById('login-form');
    if (!loginSection || !loginForm) return;

    // Login Form Validation & Submit
    loginForm.onsubmit = (e) => {
      e.preventDefault();
      clearErrors();

      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const role = document.getElementById('login-role').value;
      const password = document.getElementById('login-password').value;

      let hasError = false;

      // 1. Email check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        showFieldError('err-login-email', 'Please enter a valid email address.');
        hasError = true;
      }

      // 2. Password check
      if (!password) {
        showFieldError('err-login-password', 'Password is required.');
        hasError = true;
      }

      if (hasError) return;

      // Check match in database
      const users = AuraCare.Store.getUsers();
      const matchUser = users.find(u => u.email === email && u.password === password && (u.role || 'doctor') === role);

      if (matchUser) {
        sessionStorage.setItem('auracare_active_user', JSON.stringify(matchUser));
        AuraCare.Toasts.success(`Logged in as ${matchUser.name}`);
        checkAuth();
      } else {
        showFieldError('err-login-password', 'Invalid credentials for the selected role.');
      }
    };
  }

  function handleRouteChange() {
    if (!isLoggedIn()) return;

    let hash = window.location.hash || '#dashboard';
    
    if (!ROUTES[hash] || !isRouteAllowed(hash)) {
      window.location.hash = '#dashboard';
      return;
    }

    currentHash = hash;

    // Update active nav class
    updateSidebarNav();

    // Close mobile menu
    const sidebar = document.getElementById('app-sidebar');
    if (sidebar) sidebar.classList.remove('open');

    AuraCare.Modal.close();

    // Render active workspace in center
    renderActiveView();
  }

  function renderActiveView() {
    const view = ROUTES[currentHash];
    if (view && typeof view.render === 'function') {
      try {
        view.render();
      } catch (e) {
        console.error(`Error rendering view ${currentHash}:`, e);
        document.getElementById('app-viewport').innerHTML = `
          <div class="card" style="border: 1px solid var(--danger);">
            <h4 class="text-danger">Clinical Console Render Error</h4>
            <p style="font-size:0.8rem; margin-top:4px; color:var(--text-secondary);">There was an issue loading the viewport. Please reload the console.</p>
          </div>
        `;
      }
    }
  }

  function updateSidebarNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const href = item.getAttribute('href');
      if (href === currentHash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  function updateGlobalPanels() {
    if (window.lucide) {
      window.lucide.createIcons();
    }
    updateNotificationBadge();
  }

  function setupGlobalEvents() {
    // 1. Mobile off-canvas menu toggle
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('app-sidebar');
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('open');
      });

      // Close sidebar if clicking outside
      document.addEventListener('click', (e) => {
        if (!sidebar.contains(e.target) && e.target !== menuToggle) {
          sidebar.classList.remove('open');
        }
      });
    }

    // Close sidebar when clicking links
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('open');
      });
    });

    // 3. Logout trigger (Sidebar Badge footer)
    const logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to securely logout from the operations console?')) {
          sessionStorage.removeItem('auracare_active_user');
          AuraCare.Toasts.warning('Securely logged out.');
          checkAuth();
        }
      });
    }

    // 4. Global Header Search delegation
    const globalSearch = document.getElementById('global-search-input');
    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        
        if (currentHash === '#patients') {
          AuraCare.Views.Patients.currentSearch = query;
          AuraCare.Views.Patients.currentPage = 1;
          AuraCare.Views.Patients.renderPatientRows();
          
          const viewSearchInput = document.getElementById('patient-search-input');
          if (viewSearchInput) viewSearchInput.value = query;
        }
      });
    }

    setupThemeToggle();
    setupNotifications();
  }

  function setupNotifications() {
    const bellBtn = document.getElementById('btn-notifications');
    const dropdown = document.getElementById('notif-dropdown');
    const markReadBtn = document.getElementById('btn-mark-all-read');
    if (!bellBtn || !dropdown) return;

    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('hidden');
      if (!dropdown.classList.contains('hidden')) renderNotifications();
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== bellBtn) {
        dropdown.classList.add('hidden');
      }
    });

    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        AuraCare.Store.markAllLogsRead();
        renderNotifications();
        updateNotificationBadge();
      });
    }

    updateNotificationBadge();
  }

  function renderNotifications() {
    const list = document.getElementById('notif-dropdown-list');
    if (!list) return;
    const logs = AuraCare.Store.getSystemLogs().slice(0, 20);

    if (logs.length === 0) {
      list.innerHTML = `<div class="notif-item">No notifications yet.</div>`;
      return;
    }

    list.innerHTML = logs.map(l => `
      <div class="notif-item ${!l.read ? 'unread' : ''}">
        ${l.text}
        <span class="notif-date">${l.date}</span>
      </div>
    `).join('');
  }

  function updateNotificationBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const count = AuraCare.Store.getUnreadLogCount ? AuraCare.Store.getUnreadLogCount() : 0;
    if (count > 0) {
      badge.textContent = count > 9 ? '9+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function setupThemeToggle() {
    const storedTheme = localStorage.getItem('auracare_theme') || 'light';
    document.body.classList.toggle('theme-dark', storedTheme === 'dark');
    updateThemeIcon(storedTheme);

    const toggle = document.getElementById('btn-theme-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const nextTheme = document.body.classList.contains('theme-dark') ? 'light' : 'dark';
      document.body.classList.toggle('theme-dark', nextTheme === 'dark');
      localStorage.setItem('auracare_theme', nextTheme);
      updateThemeIcon(nextTheme);
    });
  }

  function updateThemeIcon(theme) {
    const toggle = document.getElementById('btn-theme-toggle');
    if (!toggle) return;
    toggle.innerHTML = `<i data-lucide="${theme === 'dark' ? 'sun' : 'moon'}" style="width:14px; height:14px;"></i>`;
    if (window.lucide) window.lucide.createIcons({ node: toggle });
  }

  return {
    init: init,
    getActiveUser,
    getActiveRole
  };
})();

// Launch SPA application
document.addEventListener('DOMContentLoaded', () => {
  AuraCare.App.init();
});
