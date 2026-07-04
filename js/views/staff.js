window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Staff = {
  currentRoleFilter: 'all',

  render: function() {
    const viewport = document.getElementById('app-viewport');
    const isAdmin = AuraCare.App.getActiveRole && AuraCare.App.getActiveRole() === 'admin';
    
    viewport.innerHTML = `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex-between" style="margin-bottom: 24px;">
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 1.75rem; font-weight: 700;">Clinical Staff Roster</h1>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">Monitor shift statuses, page on-duty doctors, and schedule staff.</p>
          </div>
          <button class="btn btn-primary ${isAdmin ? '' : 'hidden'}" id="btn-add-staff">
            <i data-lucide="user-plus"></i> Register Doctor
          </button>
        </div>

        <!-- Filter Bar -->
        <div class="card" style="padding: 16px; margin-bottom: 24px;">
          <div style="display:flex; gap:16px; align-items:center;">
            <span class="form-label" style="margin-bottom:0;">Filter by Role:</span>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-secondary btn-sm filter-btn ${this.currentRoleFilter === 'all' ? 'btn-primary' : ''}" data-role="all">All Roles</button>
              <button class="btn btn-secondary btn-sm filter-btn ${this.currentRoleFilter === 'Doctor' ? 'btn-primary' : ''}" data-role="Doctor">Physicians</button>
              <button class="btn btn-secondary btn-sm filter-btn ${this.currentRoleFilter === 'Nurse' ? 'btn-primary' : ''}" data-role="Nurse">Nursing</button>
              <button class="btn btn-secondary btn-sm filter-btn ${this.currentRoleFilter === 'Technician' ? 'btn-primary' : ''}" data-role="Technician">Lab & Tech</button>
            </div>
          </div>
        </div>

        <!-- Roster Data Grid -->
        <div class="card" style="padding:0;">
          <div class="table-container" style="border:none; margin-top:0;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Designation</th>
                  <th>Clinical Area / Specialty</th>
                  <th>Shift Schedule</th>
                  <th>Duty Status</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody id="staff-table-body">
                <!-- Dynamic rows -->
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
    this.renderStaffRows();
  },

  bindEvents: function() {
    // 1. Add staff button
    const addStaffBtn = document.getElementById('btn-add-staff');
    if (addStaffBtn) {
      addStaffBtn.addEventListener('click', () => {
        this.openAddStaffModal();
      });
    }

    // 2. Filter buttons
    const container = document.getElementById('app-viewport');
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.currentRoleFilter = btn.getAttribute('data-role');
        this.render(); // Rerender full view to redraw active state
      });
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderStaffRows: function() {
    const tableBody = document.getElementById('staff-table-body');
    if (!tableBody) return;
    const isAdmin = AuraCare.App.getActiveRole && AuraCare.App.getActiveRole() === 'admin';

    let staff = AuraCare.Store.getStaff();

    // Filter by role
    if (this.currentRoleFilter !== 'all') {
      staff = staff.filter(s => s.role === this.currentRoleFilter);
    }

    if (staff.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align:center; padding:32px; color:var(--text-muted);">
            <i data-lucide="users" style="width:36px; height:36px; margin-bottom:8px; display:block; margin:0 auto 8px auto;"></i>
            No staff records matching selection.
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ node: tableBody });
      return;
    }

    tableBody.innerHTML = staff.map(s => {
      let roleBadgeColor = 'bg-info-glow text-info';
      if (s.role === 'Doctor') roleBadgeColor = 'bg-primary-glow text-primary';
      if (s.role === 'Technician') roleBadgeColor = 'bg-warning-glow text-warning';

      return `
        <tr>
          <td class="nowrap"><span style="font-family:monospace;font-weight:600;font-size:0.8rem;background-color:var(--bg-app);padding:4px 8px;border-radius:4px;border:1px solid var(--border-color);">${s.id}</span></td>
          <td>
            <div style="font-weight:600;">${s.name}</div>
            <div style="font-size:0.75rem; color:var(--text-muted);">${s.email} | ${s.phone}</div>
          </td>
          <td><span class="badge ${roleBadgeColor}">${s.role}</span></td>
          <td><strong>${s.specialty}</strong></td>
          <td><span style="font-size:0.8125rem;">${s.shift}</span></td>
          <td>
            <select class="form-control staff-status-select" data-id="${s.id}" ${isAdmin ? '' : 'disabled'} style="width:110px; padding:4px 8px; font-size:0.75rem; font-weight:600; background-color:var(--bg-card); border-color:var(--border-color);">
              <option value="on-duty" ${s.status === 'on-duty' ? 'selected' : ''}>On-Duty</option>
              <option value="on-call" ${s.status === 'on-call' ? 'selected' : ''}>On-Call</option>
              <option value="off-duty" ${s.status === 'off-duty' ? 'selected' : ''}>Off-Duty</option>
            </select>
          </td>
          <td style="text-align:right;">
            <div style="display:flex; gap:6px; justify-content:flex-end; flex-wrap:wrap;">
              <button class="btn btn-secondary btn-sm flex-center btn-page-staff" data-name="${s.name}" data-phone="${s.phone}" ${s.status === 'off-duty' ? 'disabled' : ''}>
                <i data-lucide="bell-ring" style="width:12px;height:12px;"></i> Page
              </button>
              ${s.role === 'Doctor' ? `
                <button class="btn btn-secondary btn-sm flex-center btn-manage-schedule" data-id="${s.id}">
                  <i data-lucide="calendar-cog" style="width:12px;height:12px;"></i> Schedule
                </button>
              ` : ''}
              ${isAdmin && s.role === 'Doctor' ? `
                <button class="btn btn-secondary btn-sm flex-center btn-manage-role" data-email="${s.email}">
                  <i data-lucide="shield" style="width:12px;height:12px;"></i> Role
                </button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Bind dropdown change triggers
    tableBody.querySelectorAll('.staff-status-select').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = select.getAttribute('data-id');
        const newStatus = e.target.value;
        AuraCare.Store.updateStaffStatus(id, newStatus);
        AuraCare.Toasts.info(`Duty status changed to: ${newStatus.toUpperCase()}`);
        this.renderStaffRows(); // Reload rows to apply changes (and keep bindings intact)
      });
    });

    // Page Staff button trigger
    tableBody.querySelectorAll('.btn-page-staff').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        const phone = btn.getAttribute('data-phone');
        AuraCare.Store.addLog(`Clinical page broadcasted to: ${name} (${phone})`, 'info');
        AuraCare.Toasts.success(`Page dispatch sent to ${name}.`);
      });
    });

    tableBody.querySelectorAll('.btn-manage-schedule').forEach(btn => {
      btn.addEventListener('click', () => this.openScheduleModal(btn.getAttribute('data-id')));
    });

    tableBody.querySelectorAll('.btn-manage-role').forEach(btn => {
      btn.addEventListener('click', () => this.openRoleModal(btn.getAttribute('data-email')));
    });

    if (window.lucide) {
      window.lucide.createIcons({ node: tableBody });
    }
  },

  openAddStaffModal: function() {
    if (!AuraCare.App.getActiveRole || AuraCare.App.getActiveRole() !== 'admin') {
      AuraCare.Toasts.warning('Only admins can register doctors.');
      return;
    }

    const uniqueId = AuraCare.Utils.generateId('STF', AuraCare.Store.getStaff());

    const modalBody = `
      <form id="staff-registration-form" class="form-grid" novalidate>
        <div class="form-group">
          <label class="form-label" for="stf-id">Staff ID</label>
          <input type="text" id="stf-id" class="form-control" value="${uniqueId}" readonly>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-name">Full Name</label>
          <input type="text" id="stf-name" class="form-control" placeholder="Dr. Karen Vance" required>
          <span class="error-text hidden" id="err-stf-name" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
        <input type="hidden" id="stf-role" value="Doctor">
        <div class="form-group">
          <label class="form-label">Role Designator</label>
          <input type="text" class="form-control" value="Physician (Doctor)" readonly>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-spec">Clinical Specialty / Department</label>
          <input type="text" id="stf-spec" class="form-control" placeholder="ICU Care / Cardiology" required>
          <span class="error-text hidden" id="err-stf-spec" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-shift">Shift Assignment</label>
          <select id="stf-shift" class="form-control">
            <option value="Day (08:00 - 16:00)">Day Shift (08:00 - 16:00)</option>
            <option value="Night (16:00 - 24:00)">Night Shift (16:00 - 24:00)</option>
            <option value="Graveyard (24:00 - 08:00)">Graveyard Shift (24:00 - 08:00)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-phone">Pager / Phone Line (10 Digits)</label>
          <input type="tel" id="stf-phone" class="form-control" placeholder="10-digit pager line" required>
          <span class="error-text hidden" id="err-stf-phone" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
        <div class="form-group full-width">
          <label class="form-label" for="stf-email">Secure Institutional Email</label>
          <input type="email" id="stf-email" class="form-control" placeholder="k.vance@hospital.org" required>
          <span class="error-text hidden" id="err-stf-email" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-password">Doctor Login Password</label>
          <input type="password" id="stf-password" class="form-control" placeholder="Minimum 6 characters" required>
          <span class="error-text hidden" id="err-stf-password" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="stf-confirm-password">Confirm Password</label>
          <input type="password" id="stf-confirm-password" class="form-control" placeholder="Re-enter password" required>
          <span class="error-text hidden" id="err-stf-confirm-password" style="color:var(--danger); font-size:0.7rem; margin-top:2px;"></span>
        </div>
      </form>
    `;

    AuraCare.Modal.open('Register Doctor Account', modalBody, [
      {
        text: 'Cancel',
        className: 'btn-secondary',
        onClick: () => AuraCare.Modal.close()
      },
      {
        text: '<i data-lucide="check"></i> Register Doctor',
        className: 'btn-primary',
        onClick: () => {
          // Clear previous errors
          document.querySelectorAll('.error-text').forEach(el => {
            el.textContent = '';
            el.classList.add('hidden');
          });

          const name = document.getElementById('stf-name').value.trim();
          const role = document.getElementById('stf-role').value;
          const specialty = document.getElementById('stf-spec').value.trim();
          const shift = document.getElementById('stf-shift').value;
          const phone = document.getElementById('stf-phone').value.trim();
          const email = document.getElementById('stf-email').value.trim().toLowerCase();
          const password = document.getElementById('stf-password').value;
          const confirmPassword = document.getElementById('stf-confirm-password').value;

          let hasError = false;

          if (!name) {
            const err = document.getElementById('err-stf-name');
            if (err) { err.textContent = 'Name is required.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          if (!specialty) {
            const err = document.getElementById('err-stf-spec');
            if (err) { err.textContent = 'Specialty is required.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          if (!phone) {
            const err = document.getElementById('err-stf-phone');
            if (err) { err.textContent = 'Phone number is required.'; err.classList.remove('hidden'); }
            hasError = true;
          } else if (!/^[0-9]{10}$/.test(phone)) {
            const err = document.getElementById('err-stf-phone');
            if (err) { err.textContent = 'Phone number must be exactly 10 digits.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!email || !emailRegex.test(email)) {
            const err = document.getElementById('err-stf-email');
            if (err) { err.textContent = 'Please enter a valid institutional email.'; err.classList.remove('hidden'); }
            hasError = true;
          } else if (AuraCare.Store.getUsers().some(user => user.email === email) || AuraCare.Store.getStaff().some(member => member.email === email)) {
            const err = document.getElementById('err-stf-email');
            if (err) { err.textContent = 'This doctor email is already registered.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          let pwError = '';
          if (!password) {
            pwError = 'Password is required.';
          } else {
            if (password.length < 6) pwError += 'Password must be at least 6 characters. ';
            if (!/[A-Z]/.test(password)) pwError += 'Must contain at least 1 uppercase letter. ';
            if (!/[0-9]/.test(password)) pwError += 'Must contain at least 1 numerical digit. ';
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) pwError += 'Must contain at least 1 special character.';
          }

          if (pwError) {
            const err = document.getElementById('err-stf-password');
            if (err) { err.textContent = pwError; err.classList.remove('hidden'); }
            hasError = true;
          }

          if (!confirmPassword) {
            const err = document.getElementById('err-stf-confirm-password');
            if (err) { err.textContent = 'Please confirm the password.'; err.classList.remove('hidden'); }
            hasError = true;
          } else if (password !== confirmPassword) {
            const err = document.getElementById('err-stf-confirm-password');
            if (err) { err.textContent = 'Passwords do not match.'; err.classList.remove('hidden'); }
            hasError = true;
          }

          if (hasError) return;

          const newStaff = {
            id: uniqueId,
            name,
            role,
            specialty,
            shift,
            phone,
            email,
            status: 'on-duty'
          };

          AuraCare.Store.addStaff(newStaff);
          AuraCare.Store.addUser({ name, email, phone, password, role: 'doctor' });
          AuraCare.Toasts.success(`${name} has been registered as a doctor.`);
          AuraCare.Modal.close();
          this.render();
        }
      }
    ]);
  },

  openScheduleModal: function(staffId) {
    const staff = AuraCare.Store.getStaff().find(s => s.id === staffId);
    if (!staff) return;
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const availability = staff.availability || { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false };

    const modalBody = `
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">Set weekly availability for <strong>${staff.name}</strong> (${staff.specialty}). This controls which days appointments can be booked with this doctor.</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        ${days.map(d => `
          <label style="display:flex; flex-direction:column; align-items:center; gap:6px; padding:10px 14px; border:1px solid var(--border-color); border-radius:var(--radius-md); background:var(--bg-app); cursor:pointer;">
            <span style="font-size:0.75rem; font-weight:600;">${d}</span>
            <input type="checkbox" class="schedule-day-check" data-day="${d}" ${availability[d] ? 'checked' : ''}>
          </label>
        `).join('')}
      </div>
    `;

    AuraCare.Modal.open(`Manage Schedule - ${staff.name}`, modalBody, [
      { text: 'Cancel', className: 'btn-secondary', onClick: () => AuraCare.Modal.close() },
      {
        text: 'Save Schedule', className: 'btn-primary', onClick: () => {
          const updated = {};
          document.querySelectorAll('.schedule-day-check').forEach(chk => {
            updated[chk.getAttribute('data-day')] = chk.checked;
          });
          AuraCare.Store.updateStaffSchedule(staffId, updated);
          AuraCare.Toasts.success('Weekly schedule updated.');
          AuraCare.Modal.close();
        }
      }
    ]);
  },

  openRoleModal: function(email) {
    const users = AuraCare.Store.getUsers();
    const user = users.find(u => u.email === email);
    if (!user) {
      AuraCare.Toasts.warning('No login account found for this staff member yet.');
      return;
    }

    const modalBody = `
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">Change the access role for <strong>${user.name}</strong> (${user.email}).</p>
      <div class="form-group">
        <label class="form-label" for="role-select">Access Role</label>
        <select id="role-select" class="form-control">
          <option value="doctor" ${user.role === 'doctor' ? 'selected' : ''}>Doctor Console</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin Console</option>
        </select>
      </div>
    `;

    AuraCare.Modal.open('Manage User Role', modalBody, [
      { text: 'Cancel', className: 'btn-secondary', onClick: () => AuraCare.Modal.close() },
      {
        text: 'Update Role', className: 'btn-primary', onClick: () => {
          const newRole = document.getElementById('role-select').value;
          AuraCare.Store.updateUserRole(email, newRole);
          AuraCare.Toasts.success(`${user.name} is now assigned the ${newRole} role.`);
          AuraCare.Modal.close();
        }
      }
    ]);
  }
};
