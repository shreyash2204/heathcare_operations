window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Dashboard = {
  render: function() {
    const viewport = document.getElementById('app-viewport');
    const activeUser = AuraCare.App.getActiveUser ? AuraCare.App.getActiveUser() : null;
    const activeRole = AuraCare.App.getActiveRole ? AuraCare.App.getActiveRole() : 'doctor';
    if (activeRole === 'doctor') {
      this.renderDoctorDashboard(viewport, activeUser);
      return;
    }
    
    // Fetch statistics
    const patients = AuraCare.Store.getPatients();
    const activeCount = patients.filter(p => !p.dischargeDate).length;
    
    const beds = AuraCare.Store.getBeds();
    const occupied = beds.filter(b => b.status !== 'available').length;
    
    const staff = AuraCare.Store.getStaff();
    const onDuty = staff.filter(s => s.status === 'on-duty').length;
    
    const apts = AuraCare.Store.getAppointments().filter(a => a.status === 'scheduled').length;

    viewport.innerHTML = `
      <div class="fade-in">
        <!-- Title Header -->
        <div style="margin-bottom: 24px;">
          <h1 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700; color:var(--text-primary);">Operations Control Room</h1>
          <p style="color: var(--text-secondary); font-size: 0.8rem;">Centralized portal monitoring clinical throughput, resource coordinates, and outpatient schedulers.</p>
        </div>

        <!-- Row 1: Responsive Auto-Fit Metric Grid -->
        <div class="dashboard-metrics-grid">
          <!-- Card 1: Patients -->
          <div class="card" style="padding: 20px; cursor: pointer;" onclick="window.location.hash='#patients'" title="View Patient Directory">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Active EHR Patients</span>
              <span style="color:var(--primary); font-size:0.75rem; display:flex; align-items:center; font-weight:600;"><i data-lucide="trending-up" style="width:12px;height:12px;margin-right:2px;"></i>+4</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; font-family: var(--font-heading); margin-top:4px;">${activeCount}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top:2px;">Patients admitted in directory</div>
          </div>

          <!-- Card 2: Beds Map -->
          <div class="card" style="padding: 20px; cursor: pointer;" onclick="window.location.hash='#resources'" title="View Wards Bed Map">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Beds Allocated</span>
              <span style="color:var(--secondary); font-weight:600; font-size:0.75rem;">${occupied} occupied</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; font-family: var(--font-heading); margin-top:4px;">${occupied}/${beds.length}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top:2px;">Total ward occupancy capacity</div>
          </div>

          <!-- Card 3: Staff Roster -->
          <div class="card" style="padding: 20px; cursor: pointer;" onclick="window.location.hash='#staff'" title="View Staff Shift Roster">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Staff On-Duty</span>
              <span class="badge bg-success-glow text-success" style="font-size:0.6rem; padding:1px 6px;">Live</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; font-family: var(--font-heading); margin-top:4px;">${onDuty}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top:2px;">Physicians and nurses on roster</div>
          </div>

          <!-- Card 4: Consult Planner -->
          <div class="card" style="padding: 20px; cursor: pointer;" onclick="window.location.hash='#appointments'" title="View Consultations Scheduler">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Consults Booked</span>
              <span style="color:var(--warning); font-weight:600; font-size:0.75rem;">${apts} pending</span>
            </div>
            <div style="font-size: 1.85rem; font-weight: 700; font-family: var(--font-heading); margin-top:4px;">${apts}</div>
            <div style="font-size: 0.65rem; color: var(--text-muted); margin-top:2px;">Scheduled checkups planned</div>
          </div>
        </div>

        <!-- Row 2: Admissions Line Graph (Full Width Visual Highlight) -->
        <div class="card" style="margin-bottom: 24px; display:flex; flex-direction:column; min-height: 280px; padding: 24px;">
          <div class="card-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;"><i data-lucide="activity" style="color:var(--primary); width:16px;"></i> Admissions Trend (Last 7 Days)</div>
          <div class="svg-chart-container" id="dashboard-trend-container" style="flex:1; height: 180px;"></div>
        </div>

        <div class="dashboard-split-grid">
          
          <!-- Ward Progress List Card -->
          <div class="card" style="display:flex; flex-direction:column; min-height: 310px; padding: 24px;">
            <div class="card-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;"><i data-lucide="layout-grid" style="color:var(--secondary); width:16px;"></i> Ward Occupancy Tracker</div>
            <div id="dashboard-donut-container" style="flex:1; display:flex; align-items:center; justify-content:center; min-height: 180px; width:100%;">
              <!-- Rendered dynamically as a 2x2 grids map -->
            </div>
          </div>

          <div class="card" style="display:flex; flex-direction:column; min-height: 310px; padding: 24px;">
            <div class="card-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;"><i data-lucide="clipboard-list" style="color:var(--primary); width:16px;"></i> CSV Feature Backlog</div>
            <div id="dashboard-backlog-container" style="display:grid; grid-template-columns:1fr 1fr; gap:12px;"></div>
          </div>

        </div>
      </div>
    `;

    this.afterRender(patients, beds);
  },

  afterRender: function(patients, beds) {
    // 1. Draw admissions line chart (last 7 days calculations)
    const dates = [];
    const counts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().substring(0, 10);
      dates.push(d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }));
      
      const admissionsOnDate = patients.filter(p => p.admissionDate === dateStr).length;
      counts.push(admissionsOnDate + Math.round(Math.random() * 2 + 1));
    }

    AuraCare.Charts.renderLineChart('dashboard-trend-container', counts, dates, {
      strokeColor: 'var(--primary)',
      unit: 'admissions'
    });

    // 2. Interactive 2x2 Ward Occupancy Bed Status Maps
    const wardBeds = {};
    const wardCapacity = {};
    const wardBedDetails = {};

    beds.forEach(bed => {
      wardCapacity[bed.ward] = (wardCapacity[bed.ward] || 0) + 1;
      if (!wardBedDetails[bed.ward]) wardBedDetails[bed.ward] = [];
      
      const isOccupied = bed.status !== 'available';
      const patient = isOccupied ? patients.find(p => p.id === bed.patientId) : null;
      
      wardBedDetails[bed.ward].push({
        id: bed.id,
        occupied: isOccupied,
        severity: patient ? patient.severity : 'vacant'
      });

      if (isOccupied) {
        wardBeds[bed.ward] = (wardBeds[bed.ward] || 0) + 1;
      } else {
        wardBeds[bed.ward] = wardBeds[bed.ward] || 0;
      }
    });

    const donutContainer = document.getElementById('dashboard-donut-container');
    if (donutContainer) {
      const wardsList = Object.keys(wardCapacity);
      if (wardsList.length === 0) {
        donutContainer.innerHTML = `
          <div style="color:var(--text-muted); font-size:0.8rem; text-align:center; padding: 20px 0;">
            No active wards configured.
          </div>
        `;
      } else {
        donutContainer.innerHTML = `
          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px; width:100%;">
            ${wardsList.map(ward => {
              const occupied = wardBeds[ward] || 0;
              const total = wardCapacity[ward] || 1;
              const pct = Math.round((occupied / total) * 100);
              
              let statusLabel = 'SAFE';
              let statusClass = 'bg-success-glow text-success';
              if (pct >= 85) {
                statusLabel = 'FULL CAPACITY';
                statusClass = 'bg-danger-glow text-danger';
              } else if (pct >= 60) {
                statusLabel = 'BUSY';
                statusClass = 'bg-warning-glow text-warning';
              }

              // Draw bed cell indicator dots
              const bedCellsHtml = (wardBedDetails[ward] || []).map(b => {
                let cellColor = '#e2e8f0'; // light gray (vacant)
                if (b.occupied) {
                  if (b.severity === 'critical') cellColor = 'var(--danger)';
                  else if (b.severity === 'high') cellColor = 'var(--warning)';
                  else cellColor = 'var(--primary)';
                }
                return `<span style="width:10px; height:10px; border-radius:2px; background-color:${cellColor}; display:inline-block;" title="Bed ${b.id}"></span>`;
              }).join('');

              return `
                <div style="background-color:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:10px; display:flex; flex-direction:column; gap:4px; text-align:left;">
                  <div class="flex-between">
                    <span style="font-weight:700; font-size:0.75rem; color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:90px;" title="${ward}">${ward}</span>
                    <span class="badge ${statusClass}" style="font-size:0.5rem; padding:1px 3px;">${statusLabel}</span>
                  </div>
                  <div style="font-family:monospace; font-size:0.7rem; color:var(--text-secondary); font-weight:600; margin-bottom:2px;">
                    ${occupied} / ${total} Beds (${pct}%)
                  </div>
                  <!-- Visual beds map -->
                  <div style="display:flex; gap:3px; flex-wrap:wrap; background-color:var(--bg-panel); border:1px solid var(--border-color); border-radius:4px; padding:4px; min-height:22px; align-items:center;">
                    ${bedCellsHtml}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }
    }

    const backlogContainer = document.getElementById('dashboard-backlog-container');
    if (backlogContainer) {
      const backlog = [
        ['Patient', 'Registration, search, profile, admission'],
        ['Doctor & Staff', 'Doctor profile, schedule, consultation, prescriptions'],
        ['Lab', 'Orders, samples, result entry'],
        ['Finance', 'Billing, payment, insurance claims'],
        ['Cross Module', 'Authentication, RBAC, notifications, KPI dashboard']
      ];
      backlogContainer.innerHTML = backlog.map(([module, features]) => `
        <div style="background-color:var(--bg-app); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px;">
          <strong style="font-size:0.85rem;">${module}</strong>
          <p style="font-size:0.75rem; color:var(--text-secondary); margin-top:4px;">${features}</p>
        </div>
      `).join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  renderDoctorDashboard: function(viewport, user) {
    const patients = AuraCare.Store.getPatients().filter(p => !p.dischargeDate && this.isDoctorPatient(p, user));
    const staff = AuraCare.Store.getStaff();
    const doctorStaff = staff.find(s => s.email === user?.email || s.name === user?.name) || staff.find(s => s.name === 'Dr. Sarah Jenkins');
    const appointments = AuraCare.Store.getAppointments().filter(a => a.doctorName === (doctorStaff?.name || user?.name));

    viewport.innerHTML = `
      <div class="fade-in">
        <div style="margin-bottom: 24px;">
          <h1 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700;">Doctor Dashboard</h1>
          <p style="color: var(--text-secondary); font-size: 0.8rem;">Assigned EHR records, shift schedule, and upcoming consults.</p>
        </div>

        <div class="dashboard-metrics-grid">
          <div class="card" style="padding:20px;">
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Assigned Patients</span>
            <div style="font-size:1.85rem; font-weight:700; font-family:var(--font-heading);">${patients.length}</div>
          </div>
          <div class="card" style="padding:20px;">
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Shift</span>
            <div style="font-size:1rem; font-weight:700; margin-top:8px;">${doctorStaff?.shift || 'Day (08:00 - 16:00)'}</div>
          </div>
          <div class="card" style="padding:20px;">
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">Duty Status</span>
            <div style="margin-top:10px;"><span class="badge bg-info-glow text-info">${doctorStaff?.status || 'on-duty'}</span></div>
          </div>
          <div class="card" style="padding:20px; cursor:pointer;" onclick="window.location.hash='#patients'">
            <span style="font-size:0.8rem; font-weight:600; color:var(--text-secondary);">EHR Updates</span>
            <div style="font-size:0.85rem; color:var(--primary); margin-top:10px; font-weight:700;">Open Patient Records</div>
          </div>
        </div>

        <div class="doctor-focus-panel">
          <div class="card" style="padding:0;">
            <div class="card-title" style="padding:18px 20px; margin:0; border-bottom:1px solid var(--border-color);"><i data-lucide="heart-pulse" style="color:var(--danger); width:16px;"></i> My Patient Records</div>
            <div class="table-container" style="border:0; border-radius:0;">
              <table class="data-table">
                <thead><tr><th>EMR ID</th><th>Patient</th><th>Severity</th><th>Bed</th><th></th></tr></thead>
                <tbody>
                  ${patients.length ? patients.slice(0, 5).map(p => `
                    <tr>
                      <td class="nowrap">${p.id}</td>
                      <td><strong>${p.name}</strong><div style="font-size:0.75rem;color:var(--text-muted);">${p.diagnosis}</div></td>
                      <td>${AuraCare.Utils.getSeverityBadge(p.severity)}</td>
                      <td class="nowrap">${p.bed || 'Unallocated'}</td>
                      <td style="text-align:right;"><button class="btn btn-secondary btn-sm btn-doctor-ehr" data-id="${p.id}"><i data-lucide="file-pen-line" style="width:12px;"></i> Update EHR</button></td>
                    </tr>
                  `).join('') : `<tr><td colspan="5" style="text-align:center; padding:30px; color:var(--text-muted);">No assigned patient records.</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>

          <div class="card">
            <div class="card-title"><i data-lucide="calendar-clock" style="color:var(--primary); width:16px;"></i> Shift Schedule</div>
            <div class="schedule-chip"><span>Today</span><strong>${doctorStaff?.shift || 'Day (08:00 - 16:00)'}</strong></div>
            <div style="height:12px;"></div>
            <div class="card-title" style="font-size:0.9rem; margin-top:10px;"><i data-lucide="calendar-check" style="color:var(--secondary); width:16px;"></i> Consults</div>
            <div style="display:flex; flex-direction:column; gap:10px;">
              ${appointments.length ? appointments.map(a => `
                <div class="schedule-chip">
                  <div><strong>${a.patientName}</strong><div style="font-size:0.72rem;color:var(--text-muted);">${a.reason}</div></div>
                  <span style="font-size:0.78rem;font-weight:700;">${AuraCare.Utils.formatDate(a.date)} ${a.time}</span>
                </div>
              `).join('') : '<p style="font-size:0.8rem;color:var(--text-muted);">No consults scheduled.</p>'}
            </div>
          </div>
        </div>
      </div>
    `;

    viewport.querySelectorAll('.btn-doctor-ehr').forEach(btn => {
      btn.addEventListener('click', () => AuraCare.Views.Patients.openPatientProfileModal(btn.getAttribute('data-id')));
    });

    if (window.lucide) window.lucide.createIcons();
  },

  isDoctorPatient: function(patient, user) {
    if (!user) return false;
    const staff = AuraCare.Store.getStaff();
    const staffMember = staff.find(s => s.email === user.email || s.name === user.name);
    const doctorName = staffMember?.name || user.name;
    return patient.doctor === doctorName || (user.email === 's.jenkins@hospital.org' && patient.doctor === 'Dr. Sarah Jenkins');
  }
};
