window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Resources = {
  render: function() {
    const viewport = document.getElementById('app-viewport');
    const isAdmin = AuraCare.App.getActiveRole && AuraCare.App.getActiveRole() === 'admin';
    const wards = AuraCare.Store.getWards();

    viewport.innerHTML = `
      <div class="fade-in">
        <!-- Header -->
        <div class="flex-between" style="margin-bottom: 24px; flex-wrap:wrap; gap:12px;">
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700;">Facility Resources & Bed Grid</h1>
            <p style="color: var(--text-secondary); font-size: 0.8rem;">Monitor live ward coordinates, allocate beds for admitted patients, and manage pharmaceutical stockpiles.</p>
          </div>
          ${isAdmin ? `<button class="btn btn-secondary" id="btn-manage-wards"><i data-lucide="settings-2"></i> Manage Wards & Beds</button>` : ''}
        </div>

        <!-- Section split layout -->
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; align-items: start;">
          <!-- Bed Grid Coordinates Card -->
          <div class="card" style="padding: 24px;">
            <div class="flex-between" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 20px;">
              <h3 style="font-size: 1.05rem; font-weight: 600; display:flex; align-items:center; gap:8px;"><i data-lucide="layout-grid" style="color:var(--primary); width:18px;"></i> Hospital Bed Layout Mapping</h3>
              <div style="display:flex; gap:10px; font-size:0.7rem; font-weight:600;">
                <span style="display:flex; align-items:center; gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background-color:var(--success);display:inline-block;"></span> Vacant</span>
                <span style="display:flex; align-items:center; gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background-color:var(--primary);display:inline-block;"></span> Admitted</span>
                <span style="display:flex; align-items:center; gap:4px;"><span style="width:7px;height:7px;border-radius:50%;background-color:var(--danger);display:inline-block;"></span> Critical</span>
              </div>
            </div>

            <div id="ward-sections-container">
              ${wards.map(w => `
                <div class="ward-section">
                  <div class="ward-header">${w.name} <span style="font-weight:400; color:var(--text-muted); font-size:0.75rem;">(${w.department})</span></div>
                  <div class="bed-grid" id="ward-grid-${w.id}"></div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Medical Inventory Stock Tracker Card -->
          <div class="card" style="padding: 24px;">
            <h3 class="card-title" style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 16px;"><i data-lucide="boxes" style="color:var(--secondary); width:18px;"></i> Supplies Inventory Roster</h3>
            <div style="display:flex; flex-direction:column; gap:14px;" id="inventory-list-container">
              <!-- Rendered reactively -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderWards();
    this.renderInventory();

    const manageBtn = document.getElementById('btn-manage-wards');
    if (manageBtn) manageBtn.addEventListener('click', () => this.openManageWardsModal());

    if (window.lucide) window.lucide.createIcons();
  },

  renderWards: function() {
    const beds = AuraCare.Store.getBeds();
    const patients = AuraCare.Store.getPatients();
    const wards = AuraCare.Store.getWards();

    const generateBedHtml = (bed) => {
      let cssClass = 'available';
      let icon = 'circle-slash';
      let statusText = 'Vacant';
      let patientLabel = '';

      if (bed.status !== 'available') {
        const patient = patients.find(p => p.id === bed.patientId);
        if (patient) {
          cssClass = patient.severity === 'critical' ? 'critical' : 'occupied';
          icon = 'user';
          statusText = patient.severity === 'critical' ? 'CRITICAL' : 'Occupied';
          patientLabel = `<div style="font-size:0.7rem; font-weight:600; margin-top:3px; max-width:80px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; color:var(--text-primary);">${patient.name || 'Admitted'}</div>`;
        }
      }

      return `
        <div class="bed-card ${cssClass}" data-bed-id="${bed.id}">
          <i data-lucide="${icon}" class="bed-icon"></i>
          <span class="bed-number">${bed.id}</span>
          <span class="bed-status">${statusText}</span>
          ${patientLabel}
        </div>
      `;
    };

    wards.forEach(w => {
      const container = document.getElementById(`ward-grid-${w.id}`);
      if (!container) return;
      const wardBeds = beds.filter(b => b.ward === w.name);
      container.innerHTML = wardBeds.length
        ? wardBeds.map(generateBedHtml).join('')
        : `<p style="font-size:0.75rem; color:var(--text-muted); grid-column: 1/-1;">No beds configured for this ward yet.</p>`;
    });

    document.querySelectorAll('.bed-card').forEach(card => {
      card.addEventListener('click', () => {
        const bedId = card.getAttribute('data-bed-id');
        this.handleBedClick(bedId);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  },

  renderInventory: function() {
    const inv = AuraCare.Store.getInventory();
    const container = document.getElementById('inventory-list-container');
    if (!container) return;

    container.innerHTML = inv.map(item => {
      const percent = Math.min(Math.round((item.stock / (item.minStock * 2.5)) * 100), 100);
      const isLow = item.stock < item.minStock;

      let barColor = 'var(--secondary)';
      if (isLow) barColor = 'var(--danger)';

      return `
        <div style="background-color:var(--bg-app); padding:14px; border-radius:var(--radius-md); border:1px solid var(--border-color);">
          <div class="flex-between" style="font-size:0.8rem; font-weight:600; margin-bottom:8px;">
            <span style="color:var(--text-primary);">${item.name}</span>
            <span style="font-family:monospace; color:${isLow ? 'var(--danger)' : 'var(--text-primary)'}; font-size:0.85rem;">${item.stock} ${item.unit}</span>
          </div>
          <div style="width:100%; height:6px; background-color:var(--border-color); border-radius:3px; overflow:hidden; position:relative; margin-bottom:8px;">
            <div style="width:${percent}%; height:100%; background-color:${barColor}; border-radius:3px; transition: width 0.3s ease;"></div>
          </div>
          <div class="flex-between" style="font-size:0.7rem; color:var(--text-secondary); flex-wrap:wrap; gap:6px;">
            <span>Min Alert: ${item.minStock} | Area: ${item.location}</span>
            <div style="display:flex; gap:6px;">
              ${item.category === 'Medications' ? `<button class="btn btn-primary btn-sm btn-dispense" data-id="${item.id}" style="padding:2px 8px; font-size:0.65rem;"><i data-lucide="pill" style="width:11px;height:11px;"></i> Dispense</button>` : ''}
              <button class="btn btn-secondary btn-sm btn-stock-adjust" data-id="${item.id}" data-val="-5" style="padding:1px 5px; font-size:0.6rem;">-5</button>
              <button class="btn btn-secondary btn-sm btn-stock-adjust" data-id="${item.id}" data-val="20" style="padding:1px 5px; font-size:0.6rem;">+20 (Reorder)</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    container.querySelectorAll('.btn-stock-adjust').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const adjustValue = parseInt(btn.getAttribute('data-val'), 10);

        AuraCare.Store.adjustStock(id, adjustValue);
        this.render();
      });
    });

    container.querySelectorAll('.btn-dispense').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDispenseModal(btn.getAttribute('data-id'));
      });
    });
  },

  openDispenseModal: function(itemId) {
    const item = AuraCare.Store.getInventory().find(i => i.id === itemId);
    const patients = AuraCare.Store.getPatients().filter(p => !p.dischargeDate);

    const modalBody = `
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">Dispense <strong>${item.name}</strong> (${item.stock} ${item.unit} currently in stock).</p>
      <form id="dispense-form" class="form-grid">
        <div class="form-group full-width">
          <label class="form-label" for="dispense-patient">Dispense To Patient</label>
          <select id="dispense-patient" class="form-control">
            <option value="">General Stock Room (no specific patient)</option>
            ${patients.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('')}
          </select>
        </div>
        <div class="form-group full-width">
          <label class="form-label" for="dispense-qty">Quantity (${item.unit})</label>
          <input type="number" id="dispense-qty" class="form-control" min="1" max="${item.stock}" value="1">
          <span class="error-text hidden" id="err-dispense-qty"></span>
        </div>
      </form>
    `;

    AuraCare.Modal.open('Dispense Medicine', modalBody, [
      { text: 'Cancel', className: 'btn-secondary', onClick: () => AuraCare.Modal.close() },
      {
        text: 'Confirm Dispense', className: 'btn-primary', onClick: () => {
          const patientId = document.getElementById('dispense-patient').value;
          const patient = patientId ? patients.find(p => p.id === patientId) : null;
          const qty = parseInt(document.getElementById('dispense-qty').value, 10);

          if (!qty || qty < 1) {
            document.getElementById('err-dispense-qty').textContent = 'Enter a valid quantity.';
            document.getElementById('err-dispense-qty').classList.remove('hidden');
            return;
          }

          const result = AuraCare.Store.dispenseMedicine(itemId, patientId, patient ? patient.name : null, qty);
          if (!result.ok) {
            document.getElementById('err-dispense-qty').textContent = result.message;
            document.getElementById('err-dispense-qty').classList.remove('hidden');
            return;
          }

          AuraCare.Toasts.success('Medicine dispensed successfully.');
          AuraCare.Modal.close();
          this.render();
        }
      }
    ]);
  },

  openManageWardsModal: function() {
    const wards = AuraCare.Store.getWards();
    const beds = AuraCare.Store.getBeds();

    const bodyHtml = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        <div>
          <h4 style="font-size:0.9rem; margin-bottom:10px;">Ward Master</h4>
          <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px;" id="ward-master-list">
            ${wards.map(w => `
              <div class="flex-between" style="padding:8px 12px; background:var(--bg-app); border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:0.8rem;">
                <span><strong>${w.name}</strong> — ${w.department} (capacity ${w.capacity})</span>
                <button class="btn btn-danger btn-sm btn-remove-ward" data-id="${w.id}" style="padding:2px 8px; font-size:0.65rem;">Remove</button>
              </div>
            `).join('')}
          </div>
          <form id="add-ward-form" class="form-grid" style="margin-bottom:0;">
            <div class="form-group"><input type="text" id="new-ward-name" class="form-control" placeholder="Ward name"></div>
            <div class="form-group"><input type="text" id="new-ward-dept" class="form-control" placeholder="Department"></div>
            <div class="form-group"><input type="number" id="new-ward-capacity" class="form-control" placeholder="Capacity" min="1"></div>
            <div class="form-group"><button type="button" class="btn btn-secondary" id="btn-add-ward" style="width:100%;">Add Ward</button></div>
          </form>
        </div>

        <div style="border-top:1px solid var(--border-color); padding-top:16px;">
          <h4 style="font-size:0.9rem; margin-bottom:10px;">Bed Master</h4>
          <div style="display:flex; flex-direction:column; gap:6px; margin-bottom:12px; max-height:180px; overflow-y:auto;" id="bed-master-list">
            ${beds.map(b => `
              <div class="flex-between" style="padding:6px 12px; background:var(--bg-app); border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:0.78rem;">
                <span>${b.id} — ${b.ward} <span style="color:var(--text-muted);">(${b.status})</span></span>
                <button class="btn btn-danger btn-sm btn-remove-bed" data-id="${b.id}" style="padding:1px 6px; font-size:0.6rem;">Remove</button>
              </div>
            `).join('')}
          </div>
          <form id="add-bed-form" class="form-grid">
            <div class="form-group">
              <select id="new-bed-ward" class="form-control">
                ${wards.map(w => `<option value="${w.name}">${w.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><input type="text" id="new-bed-number" class="form-control" placeholder="Bed number, e.g. 6"></div>
            <div class="form-group full-width"><button type="button" class="btn btn-secondary" id="btn-add-bed" style="width:100%;">Add Bed</button></div>
          </form>
        </div>
      </div>
    `;

    AuraCare.Modal.open('Manage Wards & Beds', bodyHtml, [
      { text: 'Done', className: 'btn-primary', onClick: () => { AuraCare.Modal.close(); this.render(); } }
    ]);

    document.getElementById('btn-add-ward').addEventListener('click', () => {
      const name = document.getElementById('new-ward-name').value.trim();
      const dept = document.getElementById('new-ward-dept').value.trim() || 'General';
      const capacity = parseInt(document.getElementById('new-ward-capacity').value, 10) || 0;
      if (!name) { AuraCare.Toasts.warning('Enter a ward name.'); return; }
      AuraCare.Store.addWard({ id: 'WRD-' + name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 90 + 10), name, department: dept, capacity });
      AuraCare.Toasts.success('Ward added.');
      AuraCare.Modal.close();
      this.openManageWardsModal();
    });

    document.querySelectorAll('.btn-remove-ward').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = AuraCare.Store.removeWard(btn.getAttribute('data-id'));
        if (!result.ok) { AuraCare.Toasts.warning(result.message); return; }
        AuraCare.Toasts.success('Ward removed.');
        AuraCare.Modal.close();
        this.openManageWardsModal();
      });
    });

    document.getElementById('btn-add-bed').addEventListener('click', () => {
      const ward = document.getElementById('new-bed-ward').value;
      const number = document.getElementById('new-bed-number').value.trim();
      if (!number) { AuraCare.Toasts.warning('Enter a bed number.'); return; }
      const prefix = ward.substring(0, 3).toUpperCase();
      AuraCare.Store.addBed({ id: `${prefix}-${number}`, ward, number });
      AuraCare.Toasts.success('Bed added.');
      AuraCare.Modal.close();
      this.openManageWardsModal();
    });

    document.querySelectorAll('.btn-remove-bed').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = AuraCare.Store.removeBed(btn.getAttribute('data-id'));
        if (!result.ok) { AuraCare.Toasts.warning(result.message); return; }
        AuraCare.Toasts.success('Bed removed.');
        AuraCare.Modal.close();
        this.openManageWardsModal();
      });
    });
  },

  handleBedClick: function(bedId) {
    const beds = AuraCare.Store.getBeds();
    const bed = beds.find(b => b.id === bedId);
    if (!bed) return;

    const patients = AuraCare.Store.getPatients();

    if (bed.status !== 'available') {
      const patient = patients.find(p => p.id === bed.patientId);
      if (!patient) return;

      const modalHtml = `
        <div style="padding:8px 0; font-family:var(--font-body);">
          <h4 style="font-size:1.2rem; font-weight:700; color:var(--text-primary);">${patient.name || 'Anonymous'}</h4>
          <span style="font-size:0.8rem; color:var(--text-secondary);">EMR ID: ${patient.id} | Severity Status: <strong style="color:var(--danger);">${(patient.severity || 'low').toUpperCase()}</strong></span>
          <div style="margin-top:16px; background-color:var(--bg-app); padding:16px; border-radius:8px; border:1px solid var(--border-color); font-size:0.85rem; line-height:1.6;">
            <p><strong>Primary Diagnosis:</strong> ${patient.diagnosis || 'No Diagnosis'}</p>
            <p style="margin-top:6px;"><strong>Admitting Physician:</strong> ${patient.doctor || 'Unassigned'}</p>
            <p style="margin-top:6px;"><strong>Bed Location Coordinates:</strong> Bed ${bed.number} (${bed.ward} Ward)</p>
          </div>
          <div style="margin-top:16px; border-top:1px solid var(--border-color); padding-top:12px; display:flex; justify-content:space-between; align-items:center; font-size:0.8rem; color:var(--text-secondary);">
            <span>Blood Pressure: <strong>${patient.vitals?.bp || '120/80'}</strong> | Pulse: <strong>${patient.vitals?.hr || 75} bpm</strong></span>
            <span>SpO2 Level: <strong style="color:${(patient.vitals?.spo2 || 98) < 92 ? 'var(--danger)' : 'var(--success)'};">${patient.vitals?.spo2 || 98}%</strong></span>
          </div>
        </div>
      `;

      AuraCare.Modal.open(`Bed Mapping Status - ${bedId}`, modalHtml, [
        {
          text: 'Discharge Patient',
          className: 'btn-danger',
          onClick: () => {
            if (confirm(`Clinically discharge ${patient.name || 'admitted patient'} from Bed ${bedId}?`)) {
              AuraCare.Store.dischargePatient(patient.id);
              AuraCare.Toasts.success(`Patient ${patient.name} discharged successfully.`);
              AuraCare.Modal.close();
              this.render();
            }
          }
        },
        {
          text: 'View EHR Profile',
          className: 'btn-primary',
          onClick: () => {
            AuraCare.Modal.close();
            setTimeout(() => {
              window.AuraCare.Views.Patients.openPatientProfileModal(patient.id);
            }, 250);
          }
        }
      ]);
    } else {
      const unassignedPatients = patients.filter(p => !p.bed && !p.dischargeDate);

      if (unassignedPatients.length === 0) {
        AuraCare.Modal.open(`Allocate Bed - ${bedId}`, `
          <div style="text-align:center; padding:16px; color:var(--text-muted); font-size:0.85rem;">
            <i data-lucide="check" style="width:32px; height:32px; margin-bottom:8px; color:var(--success); display:block; margin:0 auto 8px auto;"></i>
            <p>All active hospital admissions are currently mapped to beds.</p>
          </div>
        `, [
          {
            text: 'Close',
            className: 'btn-secondary',
            onClick: () => AuraCare.Modal.close()
          }
        ]);
        return;
      }

      const patientOptions = unassignedPatients.map(p => `<option value="${p.id}">${p.name || 'Anonymous'} (${p.id}) - ${(p.severity || 'low').toUpperCase()}</option>`).join('');

      const modalHtml = `
        <form id="bed-allocation-form">
          <p style="font-size:0.825rem; color:var(--text-secondary); margin-bottom:16px;">Map a currently unassigned patient from the registry into Bed <strong>${bedId}</strong>.</p>
          <div class="form-group">
            <label class="form-label" for="alloc-patient">Awaiting Patient Profile</label>
            <select id="alloc-patient" class="form-control" required>
              <option value="">-- Select Patient Profile --</option>
              ${patientOptions}
            </select>
          </div>
        </form>
      `;

      AuraCare.Modal.open(`Allocate Bed - ${bedId}`, modalHtml, [
        {
          text: 'Cancel',
          className: 'btn-secondary',
          onClick: () => AuraCare.Modal.close()
        },
        {
          text: 'Map Bed Location',
          className: 'btn-primary',
          onClick: () => {
            const select = document.getElementById('alloc-patient');
            const patientId = select.value;
            if (patientId) {
              AuraCare.Store.allocateBed(bedId, patientId);
              AuraCare.Toasts.success('Bed allocated.');
              AuraCare.Modal.close();
              this.render();
            }
          }
        }
      ]);
    }
  }
};
