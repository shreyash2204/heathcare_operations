window.AuraCare = window.AuraCare || {};
window.AuraCare.Views = window.AuraCare.Views || {};

AuraCare.Views.Lab = {
  currentStatusFilter: 'all',

  render: function() {
    const viewport = document.getElementById('app-viewport');

    viewport.innerHTML = `
      <div class="fade-in">
        <div class="flex-between" style="margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h1 style="font-family: var(--font-heading); font-size: 1.5rem; font-weight: 700;">Lab Diagnostics</h1>
            <p style="color: var(--text-secondary); font-size: 0.8rem;">Order tests, track sample collection, and publish results back to the patient EHR.</p>
          </div>
          <button class="btn btn-primary" id="btn-order-lab-test">
            <i data-lucide="flask-conical"></i> Order Lab Test
          </button>
        </div>

        <div class="card" style="margin-bottom:20px; padding: 14px 20px;">
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-secondary btn-sm lab-filter-btn ${this.currentStatusFilter === 'all' ? 'btn-primary' : ''}" data-status="all">All</button>
            <button class="btn btn-secondary btn-sm lab-filter-btn ${this.currentStatusFilter === 'ordered' ? 'btn-primary' : ''}" data-status="ordered">Ordered</button>
            <button class="btn btn-secondary btn-sm lab-filter-btn ${this.currentStatusFilter === 'sample_collected' ? 'btn-primary' : ''}" data-status="sample_collected">Sample Collected</button>
            <button class="btn btn-secondary btn-sm lab-filter-btn ${this.currentStatusFilter === 'result_ready' ? 'btn-primary' : ''}" data-status="result_ready">Result Ready</button>
          </div>
        </div>

        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Patient</th>
                <th>Test</th>
                <th>Ordered By</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="lab-orders-body"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderRows();

    document.getElementById('btn-order-lab-test').addEventListener('click', () => this.openOrderModal());
    document.querySelectorAll('.lab-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentStatusFilter = btn.getAttribute('data-status');
        this.render();
      });
    });

    if (window.lucide) window.lucide.createIcons();
  },

  statusBadge: function(status) {
    const map = {
      ordered: { cls: 'bg-warning-glow', label: 'Ordered' },
      sample_collected: { cls: 'bg-info-glow', label: 'Sample Collected' },
      result_ready: { cls: 'bg-success-glow', label: 'Result Ready' }
    };
    const s = map[status] || map.ordered;
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },

  renderRows: function() {
    const tbody = document.getElementById('lab-orders-body');
    if (!tbody) return;

    let orders = AuraCare.Store.getLabOrders();
    if (this.currentStatusFilter !== 'all') {
      orders = orders.filter(o => o.status === this.currentStatusFilter);
    }

    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 32px; color: var(--text-muted);">No lab orders match this filter.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map(o => `
      <tr>
        <td class="nowrap"><strong>${o.id}</strong></td>
        <td>${o.patientName}</td>
        <td>${o.testName}</td>
        <td>${o.orderedBy}</td>
        <td class="nowrap"><span class="badge ${o.priority === 'stat' ? 'bg-danger-glow' : 'bg-primary-glow'}">${o.priority === 'stat' ? 'STAT' : 'Routine'}</span></td>
        <td class="nowrap">${this.statusBadge(o.status)}</td>
        <td class="nowrap">
          ${o.status === 'ordered' ? `<button class="btn btn-secondary btn-sm btn-collect-sample" data-id="${o.id}"><i data-lucide="test-tube-2" style="width:12px;height:12px;"></i> Collect Sample</button>` : ''}
          ${o.status === 'sample_collected' ? `<button class="btn btn-success btn-sm btn-enter-result" data-id="${o.id}"><i data-lucide="clipboard-check" style="width:12px;height:12px;"></i> Enter Result</button>` : ''}
          ${o.status === 'result_ready' ? `<button class="btn btn-secondary btn-sm btn-view-result" data-id="${o.id}"><i data-lucide="eye" style="width:12px;height:12px;"></i> View Result</button>` : ''}
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    tbody.querySelectorAll('.btn-collect-sample').forEach(btn => {
      btn.addEventListener('click', () => this.openCollectModal(btn.getAttribute('data-id')));
    });
    tbody.querySelectorAll('.btn-enter-result').forEach(btn => {
      btn.addEventListener('click', () => this.openResultModal(btn.getAttribute('data-id')));
    });
    tbody.querySelectorAll('.btn-view-result').forEach(btn => {
      btn.addEventListener('click', () => this.viewResult(btn.getAttribute('data-id')));
    });
  },

  openOrderModal: function() {
    const patients = AuraCare.Store.getPatients().filter(p => !p.dischargeDate);
    const activeUser = AuraCare.App.getActiveUser ? AuraCare.App.getActiveUser() : null;

    const modalBody = `
      <form id="lab-order-form" class="form-grid">
        <div class="form-group full-width">
          <label class="form-label" for="lab-patient">Patient</label>
          <select id="lab-patient" class="form-control" required>
            <option value="">Select patient...</option>
            ${patients.map(p => `<option value="${p.id}">${p.name} (${p.id})</option>`).join('')}
          </select>
          <span class="error-text hidden" id="err-lab-patient"></span>
        </div>
        <div class="form-group full-width">
          <label class="form-label" for="lab-test-name">Test Name</label>
          <input type="text" id="lab-test-name" class="form-control" placeholder="e.g. Complete Blood Count" required>
          <span class="error-text hidden" id="err-lab-test-name"></span>
        </div>
        <div class="form-group">
          <label class="form-label" for="lab-sample-type">Sample Type</label>
          <select id="lab-sample-type" class="form-control">
            <option>Blood</option>
            <option>Urine</option>
            <option>Sputum</option>
            <option>Tissue</option>
            <option>Swab</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label" for="lab-priority">Priority</label>
          <select id="lab-priority" class="form-control">
            <option value="routine">Routine</option>
            <option value="stat">STAT (Urgent)</option>
          </select>
        </div>
      </form>
    `;

    AuraCare.Modal.open('Order Lab Test', modalBody, [
      { text: 'Cancel', className: 'btn-secondary', onClick: () => AuraCare.Modal.close() },
      {
        text: 'Submit Order', className: 'btn-primary', onClick: () => {
          const patientId = document.getElementById('lab-patient').value;
          const testName = document.getElementById('lab-test-name').value.trim();
          let hasError = false;

          if (!patientId) { document.getElementById('err-lab-patient').textContent = 'Select a patient.'; document.getElementById('err-lab-patient').classList.remove('hidden'); hasError = true; }
          if (!testName) { document.getElementById('err-lab-test-name').textContent = 'Enter a test name.'; document.getElementById('err-lab-test-name').classList.remove('hidden'); hasError = true; }
          if (hasError) return;

          const patient = AuraCare.Store.getPatient(patientId);
          const order = {
            id: 'LAB-' + Math.floor(100 + Math.random() * 900),
            patientId,
            patientName: patient.name,
            testName,
            orderedBy: activeUser ? activeUser.name : 'Clinical Staff',
            orderDate: new Date().toISOString().substring(0, 10),
            status: 'ordered',
            priority: document.getElementById('lab-priority').value,
            sampleType: document.getElementById('lab-sample-type').value,
            collectedDate: null, collectedBy: null, resultDate: null, result: null
          };

          AuraCare.Store.addLabOrder(order);
          AuraCare.Toasts.success('Lab test ordered.');
          AuraCare.Modal.close();
        }
      }
    ]);
  },

  openCollectModal: function(id) {
    const order = AuraCare.Store.getLabOrders().find(o => o.id === id);
    const modalBody = `
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">Confirm sample collection for <strong>${order.testName}</strong> (${order.patientName}).</p>
      <div class="form-group">
        <label class="form-label" for="collected-by">Collected By</label>
        <input type="text" id="collected-by" class="form-control" placeholder="Technician name" value="Technician Jordan Vance">
      </div>
    `;
    AuraCare.Modal.open('Record Sample Collection', modalBody, [
      { text: 'Cancel', className: 'btn-secondary', onClick: () => AuraCare.Modal.close() },
      {
        text: 'Confirm Collection', className: 'btn-primary', onClick: () => {
          const collectedBy = document.getElementById('collected-by').value.trim() || 'Lab Technician';
          AuraCare.Store.recordSampleCollection(id, collectedBy);
          AuraCare.Toasts.success('Sample collection recorded.');
          AuraCare.Modal.close();
        }
      }
    ]);
  },

  openResultModal: function(id) {
    const order = AuraCare.Store.getLabOrders().find(o => o.id === id);
    const modalBody = `
      <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">Enter results for <strong>${order.testName}</strong> (${order.patientName}). This will be published to the patient's EHR timeline.</p>
      <div class="form-group">
        <label class="form-label" for="lab-result-text">Result Summary</label>
        <textarea id="lab-result-text" class="form-control" rows="4" placeholder="e.g. WBC 11.2 (elevated), Hgb 13.4, Platelets normal."></textarea>
        <span class="error-text hidden" id="err-lab-result"></span>
      </div>
    `;
    AuraCare.Modal.open('Enter Lab Result', modalBody, [
      { text: 'Cancel', className: 'btn-secondary', onClick: () => AuraCare.Modal.close() },
      {
        text: 'Publish Result', className: 'btn-success', onClick: () => {
          const result = document.getElementById('lab-result-text').value.trim();
          if (!result) {
            document.getElementById('err-lab-result').textContent = 'Enter a result summary.';
            document.getElementById('err-lab-result').classList.remove('hidden');
            return;
          }
          AuraCare.Store.enterLabResult(id, result);
          AuraCare.Toasts.success('Result published to patient EHR.');
          AuraCare.Modal.close();
        }
      }
    ]);
  },

  viewResult: function(id) {
    const order = AuraCare.Store.getLabOrders().find(o => o.id === id);
    const modalBody = `
      <div style="font-size:0.85rem; line-height:1.6;">
        <p><strong>Patient:</strong> ${order.patientName}</p>
        <p><strong>Test:</strong> ${order.testName}</p>
        <p><strong>Sample collected:</strong> ${order.collectedDate} by ${order.collectedBy}</p>
        <p><strong>Result date:</strong> ${order.resultDate}</p>
        <p style="margin-top:12px; padding:12px; background:var(--bg-app); border-radius:var(--radius-md); border:1px solid var(--border-color);">${order.result}</p>
      </div>
    `;
    AuraCare.Modal.open('Lab Result', modalBody, [
      { text: 'Close', className: 'btn-secondary', onClick: () => AuraCare.Modal.close() }
    ]);
  }
};
