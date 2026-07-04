window.AuraCare = window.AuraCare || {};

AuraCare.Store = (function() {
  // Keys for LocalStorage
  const KEYS = {
    PATIENTS: 'auracare_patients',
    STAFF: 'auracare_staff',
    BEDS: 'auracare_beds',
    WARDS: 'auracare_wards',
    APPOINTMENTS: 'auracare_appointments',
    INVENTORY: 'auracare_inventory',
    BILLING: 'auracare_billing',
    CLAIMS: 'auracare_claims',
    LAB_ORDERS: 'auracare_lab_orders',
    CONSULTATIONS: 'auracare_consultations',
    LOGS: 'auracare_logs',
    USERS: 'auracare_users'
  };

  // Predefined / Initial Seed Data
  const SEED_PATIENTS = [
    {
      id: 'PAT-001',
      name: 'Robert Chen',
      age: 45,
      gender: 'Male',
      dob: '1981-04-12',
      severity: 'critical',
      admissionDate: '2026-07-01',
      diagnosis: 'Acute Coronary Syndrome, STEMI',
      ward: 'ICU',
      bed: 'ICU-1',
      doctor: 'Dr. Sarah Jenkins',
      vitals: { bp: '142/90', hr: 98, temp: '98.9°F', spo2: 91 },
      medications: ['Aspirin 325mg', 'Clopidogrel 75mg', 'Heparin Infusion'],
      billingStatus: 'pending',
      history: [
        { date: '2026-07-01 10:15', type: 'admission', author: 'Dr. Sarah Jenkins', text: 'Admitted to ICU post-PCI. Stent placed in LAD. High risk of arrhythmia.' },
        { date: '2026-07-02 08:30', type: 'vital_check', author: 'Nurse Emily Vance', text: 'Vitals stable but SpO2 remains borderline. Oxygen therapy at 2L/min ongoing.' }
      ]
    },
    {
      id: 'PAT-002',
      name: 'Elena Rostova',
      age: 29,
      gender: 'Female',
      dob: '1997-08-24',
      severity: 'high',
      admissionDate: '2026-07-02',
      diagnosis: 'Severe Diabetic Ketoacidosis (DKA)',
      ward: 'Emergency',
      bed: 'ER-3',
      doctor: 'Dr. Alexander Mercer',
      vitals: { bp: '110/68', hr: 112, temp: '100.1°F', spo2: 97 },
      medications: ['Regular Insulin IV Infusion', '0.9% Normal Saline IV', 'Potassium Chloride'],
      billingStatus: 'unbilled',
      history: [
        { date: '2026-07-02 14:00', type: 'admission', author: 'Dr. Alexander Mercer', text: 'Admitted via EMS in semi-comatose state. Blood glucose 450 mg/dL, pH 7.15.' },
        { date: '2026-07-02 18:00', type: 'lab_result', author: 'Lab Tech Jordan', text: 'Anion gap decreasing. Serum bicarbonate rising slowly.' }
      ]
    },
    {
      id: 'PAT-003',
      name: 'Arthur Pendelton',
      age: 72,
      gender: 'Male',
      dob: '1954-11-03',
      severity: 'medium',
      admissionDate: '2026-06-28',
      diagnosis: 'Bacterial Pneumonia, COPD Flare-up',
      ward: 'General Ward',
      bed: 'GW-2',
      doctor: 'Dr. Maya Patel',
      vitals: { bp: '128/82', hr: 84, temp: '99.4°F', spo2: 94 },
      medications: ['Ceftriaxone 1g IV', 'Albuterol Nebulizer Q4H', 'Prednisone 40mg'],
      billingStatus: 'pending',
      history: [
        { date: '2026-06-28 11:00', type: 'admission', author: 'Dr. Maya Patel', text: 'Admitted with productive cough, dyspnea, and bilateral infiltrate on CXR.' },
        { date: '2026-07-01 09:00', type: 'improvement', author: 'Dr. Maya Patel', text: 'Patient reports feeling stronger. Fever resolved. Appetite returning.' }
      ]
    },
    {
      id: 'PAT-004',
      name: 'Sophia Martinez',
      age: 6,
      gender: 'Female',
      dob: '2020-01-15',
      severity: 'medium',
      admissionDate: '2026-07-02',
      diagnosis: 'Acute Appendicitis without Perforation',
      ward: 'Pediatrics',
      bed: 'PED-1',
      doctor: 'Dr. James Lin',
      vitals: { bp: '98/62', hr: 95, temp: '101.3°F', spo2: 99 },
      medications: ['Acetaminophen IV', 'Piperacillin/Tazobactam IV'],
      billingStatus: 'unbilled',
      history: [
        { date: '2026-07-02 15:30', type: 'admission', author: 'Dr. James Lin', text: 'Admitted with right lower quadrant abdominal pain. Scheduled for laparoscopic appendectomy tomorrow.' }
      ]
    },
    {
      id: 'PAT-005',
      name: 'James O\'Connor',
      age: 58,
      gender: 'Male',
      dob: '1968-03-30',
      severity: 'low',
      admissionDate: '2026-06-30',
      diagnosis: 'Cellulitis of Left Lower Extremity',
      ward: 'General Ward',
      bed: 'GW-5',
      doctor: 'Dr. Maya Patel',
      vitals: { bp: '135/85', hr: 76, temp: '98.2°F', spo2: 98 },
      medications: ['Ancef 1g IV Q8H', 'Elevation of LLE'],
      billingStatus: 'paid',
      history: [
        { date: '2026-06-30 14:00', type: 'admission', author: 'Dr. Maya Patel', text: 'Admitted with erythema and warmth in left calf. Demarcated border drawn.' },
        { date: '2026-07-02 10:00', type: 'assessment', author: 'Dr. Maya Patel', text: 'Redness fading significantly. Oral antibiotic transition planned.' }
      ]
    }
  ];

  const SEED_STAFF = [
    { id: 'STF-001', name: 'Dr. Sarah Jenkins', role: 'Doctor', specialty: 'Cardiology', status: 'on-duty', phone: '555-0199', email: 's.jenkins@hospital.org', shift: 'Day (08:00 - 16:00)', availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false } },
    { id: 'STF-002', name: 'Dr. Alexander Mercer', role: 'Doctor', specialty: 'Emergency Medicine', status: 'on-duty', phone: '555-0124', email: 'a.mercer@hospital.org', shift: 'Night (16:00 - 24:00)', availability: { Mon: true, Tue: false, Wed: true, Thu: false, Fri: true, Sat: true, Sun: false } },
    { id: 'STF-003', name: 'Dr. Maya Patel', role: 'Doctor', specialty: 'Internal Medicine', status: 'on-call', phone: '555-0156', email: 'm.patel@hospital.org', shift: 'Day (08:00 - 16:00)', availability: { Mon: true, Tue: true, Wed: false, Thu: true, Fri: true, Sat: false, Sun: false } },
    { id: 'STF-004', name: 'Dr. James Lin', role: 'Doctor', specialty: 'Pediatrics', status: 'off-duty', phone: '555-0182', email: 'j.lin@hospital.org', shift: 'Day (08:00 - 16:00)', availability: { Mon: false, Tue: true, Wed: true, Thu: true, Fri: false, Sat: false, Sun: false } },
    { id: 'STF-005', name: 'Nurse Emily Vance', role: 'Nurse', specialty: 'ICU Care', status: 'on-duty', phone: '555-0210', email: 'e.vance@hospital.org', shift: 'Day (08:00 - 16:00)' },
    { id: 'STF-006', name: 'Nurse Marcus Cole', role: 'Nurse', specialty: 'Emergency Medicine', status: 'on-duty', phone: '555-0231', email: 'm.cole@hospital.org', shift: 'Night (16:00 - 24:00)' },
    { id: 'STF-007', name: 'Nurse Sarah Connor', role: 'Nurse', specialty: 'General Medicine', status: 'off-duty', phone: '555-0255', email: 's.connor@hospital.org', shift: 'Graveyard (24:00 - 08:00)' },
    { id: 'STF-008', name: 'Technician Jordan Vance', role: 'Technician', specialty: 'Laboratory', status: 'on-duty', phone: '555-0301', email: 'j.vance@hospital.org', shift: 'Day (08:00 - 16:00)' }
  ];

  const SEED_BEDS = [
    { id: 'ICU-1', ward: 'ICU', number: '1', status: 'occupied', patientId: 'PAT-001' },
    { id: 'ICU-2', ward: 'ICU', number: '2', status: 'available', patientId: null },
    { id: 'ICU-3', ward: 'ICU', number: '3', status: 'available', patientId: null },
    { id: 'ICU-4', ward: 'ICU', number: '4', status: 'available', patientId: null },
    { id: 'ICU-5', ward: 'ICU', number: '5', status: 'available', patientId: null },
    
    { id: 'ER-1', ward: 'Emergency', number: '1', status: 'available', patientId: null },
    { id: 'ER-2', ward: 'Emergency', number: '2', status: 'available', patientId: null },
    { id: 'ER-3', ward: 'Emergency', number: '3', status: 'occupied', patientId: 'PAT-002' },
    { id: 'ER-4', ward: 'Emergency', number: '4', status: 'available', patientId: null },
    { id: 'ER-5', ward: 'Emergency', number: '5', status: 'available', patientId: null },
    
    { id: 'GW-1', ward: 'General Ward', number: '1', status: 'available', patientId: null },
    { id: 'GW-2', ward: 'General Ward', number: '2', status: 'occupied', patientId: 'PAT-003' },
    { id: 'GW-3', ward: 'General Ward', number: '3', status: 'available', patientId: null },
    { id: 'GW-4', ward: 'General Ward', number: '4', status: 'available', patientId: null },
    { id: 'GW-5', ward: 'General Ward', number: '5', status: 'occupied', patientId: 'PAT-005' },
    { id: 'GW-6', ward: 'General Ward', number: '6', status: 'available', patientId: null },
    
    { id: 'PED-1', ward: 'Pediatrics', number: '1', status: 'occupied', patientId: 'PAT-004' },
    { id: 'PED-2', ward: 'Pediatrics', number: '2', status: 'available', patientId: null },
    { id: 'PED-3', ward: 'Pediatrics', number: '3', status: 'available', patientId: null },
    { id: 'PED-4', ward: 'Pediatrics', number: '4', status: 'available', patientId: null }
  ];

  const SEED_APPOINTMENTS = [
    { id: 'APT-101', patientId: 'PAT-005', patientName: 'James O\'Connor', doctorId: 'STF-003', doctorName: 'Dr. Maya Patel', date: '2026-07-03', time: '09:00', reason: 'Post-admission leg checkup', status: 'scheduled' },
    { id: 'APT-102', patientId: 'PAT-004', patientName: 'Sophia Martinez', doctorId: 'STF-004', doctorName: 'Dr. James Lin', date: '2026-07-03', time: '10:30', reason: 'Laparoscopic Surgery Intake', status: 'scheduled' },
    { id: 'APT-103', patientId: 'PAT-003', patientName: 'Arthur Pendelton', doctorId: 'STF-003', doctorName: 'Dr. Maya Patel', date: '2026-07-04', time: '14:00', reason: 'Pulmonary function test follow-up', status: 'scheduled' }
  ];

  const SEED_INVENTORY = [
    { id: 'INV-001', name: 'ICU Mechanical Ventilators', category: 'Equipment', stock: 4, minStock: 2, unit: 'units', location: 'ICU Supply Hallway' },
    { id: 'INV-002', name: 'Portable Defibrillators', category: 'Equipment', stock: 6, minStock: 3, unit: 'units', location: 'Emergency Bay' },
    { id: 'INV-003', name: 'Liquid Oxygen Cylinders', category: 'Consumables', stock: 12, minStock: 15, unit: 'tanks', location: 'Oxygen Facility Area' }, // Trigger warning
    { id: 'INV-004', name: 'N95 Respirator Masks', category: 'Consumables', stock: 450, minStock: 200, unit: 'pieces', location: 'Main Store Room' },
    { id: 'INV-005', name: 'Epinephrine Vials (1mg/mL)', category: 'Medications', stock: 80, minStock: 30, unit: 'vials', location: 'Pharmacy Drawer A' },
    { id: 'INV-006', name: 'Propofol Injection (10mg/mL)', category: 'Medications', stock: 15, minStock: 25, unit: 'vials', location: 'ICU Anesthesia Cart' }, // Trigger warning
    { id: 'INV-007', name: 'Sterile IV Tubing Kits', category: 'Consumables', stock: 140, minStock: 100, unit: 'kits', location: 'Central Nursing Depot' },
    { id: 'INV-008', name: 'Albuterol Inhalation Solution', category: 'Medications', stock: 60, minStock: 40, unit: 'vials', location: 'Respiratory Therapy Ward' }
  ];

  const SEED_BILLING = [
    { id: 'BIL-1001', patientId: 'PAT-005', patientName: 'James O\'Connor', amount: 1520.00, date: '2026-07-01', dueDate: '2026-07-15', status: 'paid', items: [{ description: 'Room Ward Stay (1 day)', cost: 500.00 }, { description: 'IV Antibiotics (Ancef)', cost: 320.00 }, { description: 'Lab Panel Work', cost: 700.00 }] },
    { id: 'BIL-1002', patientId: 'PAT-001', patientName: 'Robert Chen', amount: 8400.00, date: '2026-07-02', dueDate: '2026-07-20', status: 'pending', items: [{ description: 'Emergency Cardiac ICU Stay', cost: 2500.00 }, { description: 'Cardiac Angioplasty Surgery', cost: 4500.00 }, { description: 'Specialist Consultation Fee', cost: 1400.00 }] },
    { id: 'BIL-1003', patientId: 'PAT-003', patientName: 'Arthur Pendelton', amount: 2450.00, date: '2026-06-30', dueDate: '2026-07-10', status: 'pending', items: [{ description: 'General Ward Stay (2 days)', cost: 1000.00 }, { description: 'Oxygen Therapy Supply', cost: 650.00 }, { description: 'Pulmonary Specialist Fee', cost: 800.00 }] }
  ];

  const SEED_WARDS = [
    { id: 'WRD-ICU', name: 'ICU', capacity: 5, department: 'Critical Care' },
    { id: 'WRD-ER', name: 'Emergency', capacity: 5, department: 'Emergency Medicine' },
    { id: 'WRD-GEN', name: 'General Ward', capacity: 6, department: 'Internal Medicine' },
    { id: 'WRD-PED', name: 'Pediatrics', capacity: 4, department: 'Pediatric Care' }
  ];

  const SEED_LAB_ORDERS = [
    { id: 'LAB-001', patientId: 'PAT-001', patientName: 'Robert Chen', testName: 'Cardiac Troponin Panel', orderedBy: 'Dr. Sarah Jenkins', orderDate: '2026-07-02', status: 'result_ready', priority: 'stat', sampleType: 'Blood', collectedDate: '2026-07-02', collectedBy: 'Technician Jordan Vance', resultDate: '2026-07-02', result: 'Troponin I: 0.8 ng/mL (elevated). Consistent with recent MI.' },
    { id: 'LAB-002', patientId: 'PAT-002', patientName: 'Elena Rostova', testName: 'Basic Metabolic Panel', orderedBy: 'Dr. Alexander Mercer', orderDate: '2026-07-02', status: 'sample_collected', priority: 'stat', sampleType: 'Blood', collectedDate: '2026-07-02', collectedBy: 'Technician Jordan Vance', resultDate: null, result: null },
    { id: 'LAB-003', patientId: 'PAT-003', patientName: 'Arthur Pendelton', testName: 'Sputum Culture', orderedBy: 'Dr. Maya Patel', orderDate: '2026-07-01', status: 'ordered', priority: 'routine', sampleType: 'Sputum', collectedDate: null, collectedBy: null, resultDate: null, result: null }
  ];

  const SEED_CLAIMS = [
    { id: 'CLM-2001', invoiceId: 'BIL-1002', patientId: 'PAT-001', patientName: 'Robert Chen', insurer: 'BlueShield Horizon', policyNumber: 'BSH-88213', claimAmount: 8400.00, status: 'submitted', submittedDate: '2026-07-02', notes: 'Cardiac emergency admission, pre-auth on file.' },
    { id: 'CLM-2002', invoiceId: 'BIL-1003', patientId: 'PAT-003', patientName: 'Arthur Pendelton', insurer: 'MediCore Assurance', policyNumber: 'MCA-44921', claimAmount: 2450.00, status: 'approved', submittedDate: '2026-06-30', notes: 'Approved for full reimbursement.' }
  ];

  const SEED_CONSULTATIONS = [
    { id: 'CON-001', patientId: 'PAT-005', patientName: 'James O\'Connor', doctorName: 'Dr. Maya Patel', date: '2026-07-01', reason: 'Post-admission leg checkup', notes: 'Cellulitis improving, continue current antibiotic course.', appointmentId: null }
  ];


  const SEED_LOGS = [
    { date: '2026-07-02 14:00', type: 'info', text: 'Patient Elena Rostova admitted to ER-3 with Diabetic Ketoacidosis', read: true },
    { date: '2026-07-02 14:35', type: 'warning', text: 'Critical Inventory Alert: Liquid Oxygen Cylinders below safety minimum', read: false },
    { date: '2026-07-02 15:30', type: 'info', text: 'Patient Sophia Martinez admitted to PED-1 under Dr. James Lin', read: true },
    { date: '2026-07-02 17:15', type: 'critical', text: 'Emergency alert: ICU Bed 1 Patient (Robert Chen) SpO2 levels dropped to 91%', read: false }
  ];

  // Pub/Sub System
  const subscribers = {};

  function initData(dataset = {}) {
    if (!localStorage.getItem(KEYS.PATIENTS)) {
      localStorage.setItem(KEYS.PATIENTS, JSON.stringify(dataset.patients || SEED_PATIENTS));
      localStorage.setItem(KEYS.STAFF, JSON.stringify(dataset.staff || SEED_STAFF));
      localStorage.setItem(KEYS.BEDS, JSON.stringify(dataset.beds || SEED_BEDS));
      localStorage.setItem(KEYS.WARDS, JSON.stringify(dataset.wards || SEED_WARDS));
      localStorage.setItem(KEYS.APPOINTMENTS, JSON.stringify(dataset.appointments || SEED_APPOINTMENTS));
      localStorage.setItem(KEYS.INVENTORY, JSON.stringify(dataset.inventory || SEED_INVENTORY));
      localStorage.setItem(KEYS.BILLING, JSON.stringify(dataset.billing || SEED_BILLING));
      localStorage.setItem(KEYS.CLAIMS, JSON.stringify(dataset.claims || SEED_CLAIMS));
      localStorage.setItem(KEYS.LAB_ORDERS, JSON.stringify(dataset.labOrders || SEED_LAB_ORDERS));
      localStorage.setItem(KEYS.CONSULTATIONS, JSON.stringify(dataset.consultations || SEED_CONSULTATIONS));
      localStorage.setItem(KEYS.LOGS, JSON.stringify(dataset.logs || SEED_LOGS));
    }

    // Migration: backfill new collections for installs created before these features existed
    if (!localStorage.getItem(KEYS.WARDS)) localStorage.setItem(KEYS.WARDS, JSON.stringify(SEED_WARDS));
    if (!localStorage.getItem(KEYS.CLAIMS)) localStorage.setItem(KEYS.CLAIMS, JSON.stringify(SEED_CLAIMS));
    if (!localStorage.getItem(KEYS.LAB_ORDERS)) localStorage.setItem(KEYS.LAB_ORDERS, JSON.stringify(SEED_LAB_ORDERS));
    if (!localStorage.getItem(KEYS.CONSULTATIONS)) localStorage.setItem(KEYS.CONSULTATIONS, JSON.stringify(SEED_CONSULTATIONS));

    const users = JSON.parse(localStorage.getItem(KEYS.USERS)) || [];
    const requiredUsers = dataset.users || [
      {
        name: 'Dr. Sarah Jenkins',
        email: 's.jenkins@hospital.org',
        phone: '5550199000',
        password: 'Password1!',
        role: 'doctor'
      },
      {
        name: 'Admin Olivia Grant',
        email: 'admin@hospital.org',
        phone: '5550199001',
        password: 'Admin123!',
        role: 'admin'
      }
    ];

    requiredUsers.forEach(seed => {
      const existing = users.find(user => user.email === seed.email);
      if (!existing) {
        users.push(seed);
      } else if (!existing.role) {
        existing.role = seed.role;
      }
    });

    localStorage.setItem(KEYS.USERS, JSON.stringify(users));
  }

  // Get data from localStorage
  function get(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
  }

  // Set data to localStorage and publish updates
  function set(key, data, entityName) {
    localStorage.setItem(key, JSON.stringify(data));
    publish(entityName);
  }

  function publish(entityName) {
    if (subscribers[entityName]) {
      subscribers[entityName].forEach(callback => {
        try {
          callback();
        } catch (e) {
          console.error(`Error in subscriber callback for ${entityName}:`, e);
        }
      });
    }
    // Also publish a global update if views need it
    if (entityName !== 'all' && subscribers['all']) {
      subscribers['all'].forEach(callback => callback());
    }
  }

  return {
    init: async function() {
      let dataset = {};
      try {
        const response = await fetch('data/dataset.json', { cache: 'no-store' });
        if (response.ok) {
          dataset = await response.json();
        }
      } catch (error) {
        console.warn('Dataset JSON could not be loaded; using embedded fallback seed data.', error);
      }

      initData(dataset);
    },

    subscribe: function(entityName, callback) {
      if (!subscribers[entityName]) {
        subscribers[entityName] = [];
      }
      subscribers[entityName].push(callback);
    },

    // Patient Actions
    getUsers: () => get(KEYS.USERS),
    addUser: function(user) {
      const users = get(KEYS.USERS);
      if (users.some(existing => existing.email === user.email)) {
        return false;
      }
      users.push(user);
      set(KEYS.USERS, users, 'users');
      return true;
    },

    getPatients: () => get(KEYS.PATIENTS),
    getPatient: (id) => get(KEYS.PATIENTS).find(p => p.id === id),
    addPatient: function(patient) {
      const patients = get(KEYS.PATIENTS);
      patients.push(patient);
      set(KEYS.PATIENTS, patients, 'patients');
      this.addLog(`New Patient Admitted: ${patient.name} (${patient.id})`, 'info');
    },
    updatePatient: function(id, updates) {
      const patients = get(KEYS.PATIENTS);
      const index = patients.findIndex(p => p.id === id);
      if (index !== -1) {
        patients[index] = { ...patients[index], ...updates };
        set(KEYS.PATIENTS, patients, 'patients');
        this.addLog(`Patient record updated for: ${patients[index].name} (${id})`, 'info');
      }
    },
    deletePatient: function(id) {
      const patients = get(KEYS.PATIENTS);
      const patient = patients.find(p => p.id === id);
      const filtered = patients.filter(p => p.id !== id);
      set(KEYS.PATIENTS, filtered, 'patients');
      
      // Auto free bed if allocated
      if (patient && patient.bed) {
        this.deallocateBedByPatient(id);
      }
      this.addLog(`Patient record removed: ${patient ? patient.name : id}`, 'warning');
    },

    // Staff Actions
    getStaff: () => get(KEYS.STAFF),
    updateStaffStatus: function(id, status) {
      const staff = get(KEYS.STAFF);
      const index = staff.findIndex(s => s.id === id);
      if (index !== -1) {
        staff[index].status = status;
        set(KEYS.STAFF, staff, 'staff');
        this.addLog(`Staff shift updated: ${staff[index].name} is now ${status}`, 'info');
      }
    },
    addStaff: function(member) {
      const staff = get(KEYS.STAFF);
      staff.push(member);
      set(KEYS.STAFF, staff, 'staff');
      this.addLog(`Staff member added: ${member.name} (${member.role})`, 'info');
    },
    updateStaffSchedule: function(id, availability) {
      const staff = get(KEYS.STAFF);
      const index = staff.findIndex(s => s.id === id);
      if (index !== -1) {
        staff[index].availability = availability;
        set(KEYS.STAFF, staff, 'staff');
        this.addLog(`Weekly schedule updated for ${staff[index].name}`, 'info');
      }
    },

    // Bed Actions
    getBeds: () => get(KEYS.BEDS),
    allocateBed: function(bedId, patientId) {
      const beds = get(KEYS.BEDS);
      const patients = get(KEYS.PATIENTS);
      
      const bedIndex = beds.findIndex(b => b.id === bedId);
      const patientIndex = patients.findIndex(p => p.id === patientId);
      
      if (bedIndex !== -1 && patientIndex !== -1) {
        const bed = beds[bedIndex];
        const patient = patients[patientIndex];
        
        // Deallocate old bed if they had one
        if (patient.bed) {
          this.deallocateBedByPatient(patientId);
        }
        
        // Allocate new bed
        bed.status = patient.severity === 'critical' ? 'critical' : 'occupied';
        bed.patientId = patientId;
        
        patient.bed = bedId;
        patient.ward = bed.ward;
        
        // Push timeline event
        patient.history.push({
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'bed_allocation',
          author: 'System Operations',
          text: `Allocated to Bed ${bed.number} in ${bed.ward} Unit.`
        });
        
        localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
        localStorage.setItem(KEYS.BEDS, JSON.stringify(beds));
        
        publish('patients');
        publish('beds');
        
        this.addLog(`Allocated Patient ${patient.name} to Bed ${bedId}`, 'info');
      }
    },
    deallocateBedByPatient: function(patientId) {
      const beds = get(KEYS.BEDS);
      const bed = beds.find(b => b.patientId === patientId);
      if (bed) {
        bed.status = 'available';
        bed.patientId = null;
        localStorage.setItem(KEYS.BEDS, JSON.stringify(beds));
        publish('beds');
      }
    },
    dischargePatient: function(patientId) {
      const patients = get(KEYS.PATIENTS);
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        // Free bed
        this.deallocateBedByPatient(patientId);
        
        // Update patient billing status to discharge
        this.updatePatient(patientId, { bed: null, ward: null, dischargeDate: new Date().toISOString().substring(0, 10) });
        this.addLog(`Patient ${patient.name} has been clinically discharged`, 'info');
      }
    },

    // Appointment Actions
    getAppointments: () => get(KEYS.APPOINTMENTS),
    addAppointment: function(apt) {
      const apts = get(KEYS.APPOINTMENTS);
      apts.push(apt);
      set(KEYS.APPOINTMENTS, apts, 'appointments');
      this.addLog(`Appointment scheduled for ${apt.patientName} with ${apt.doctorName}`, 'info');
    },
    updateAppointmentStatus: function(id, status) {
      const apts = get(KEYS.APPOINTMENTS);
      const index = apts.findIndex(a => a.id === id);
      if (index !== -1) {
        apts[index].status = status;
        set(KEYS.APPOINTMENTS, apts, 'appointments');
        this.addLog(`Appointment ${id} marked as ${status}`, 'info');
      }
    },

    // Inventory Actions
    getInventory: () => get(KEYS.INVENTORY),
    adjustStock: function(id, amount) {
      const inv = get(KEYS.INVENTORY);
      const index = inv.findIndex(i => i.id === id);
      if (index !== -1) {
        inv[index].stock += amount;
        if (inv[index].stock < 0) inv[index].stock = 0;
        
        const item = inv[index];
        set(KEYS.INVENTORY, inv, 'inventory');
        
        if (item.stock < item.minStock) {
          this.addLog(`CRITICAL STOCK LEVEL: ${item.name} is running low (${item.stock} ${item.unit} remaining)`, 'warning');
        } else {
          this.addLog(`Inventory stock adjusted: ${item.name} total: ${item.stock}`, 'info');
        }
      }
    },

    // Billing Actions
    getBilling: () => get(KEYS.BILLING),
    addInvoice: function(invoice) {
      const bills = get(KEYS.BILLING);
      bills.push(invoice);
      set(KEYS.BILLING, bills, 'billing');
      
      // Update patient billing status
      this.updatePatient(invoice.patientId, { billingStatus: 'pending' });
      this.addLog(`New Invoice generated: ${invoice.id} for ${invoice.patientName} ($${invoice.amount})`, 'info');
    },
    payInvoice: function(id) {
      const bills = get(KEYS.BILLING);
      const index = bills.findIndex(b => b.id === id);
      if (index !== -1) {
        bills[index].status = 'paid';
        set(KEYS.BILLING, bills, 'billing');
        
        // Check patient status
        const pId = bills[index].patientId;
        this.updatePatient(pId, { billingStatus: 'paid' });
        this.addLog(`Invoice paid: ${id} ($${bills[index].amount.toFixed(2)})`, 'success');
      }
    },

    // Log Actions
    getSystemLogs: () => get(KEYS.LOGS),
    addLog: function(text, type = 'info') {
      const logs = get(KEYS.LOGS);
      const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
      logs.unshift({ date: dateStr, type, text, read: false });

      // Limit to 50 logs max
      if (logs.length > 50) logs.pop();

      set(KEYS.LOGS, logs, 'logs');
    },
    getUnreadLogCount: function() {
      return get(KEYS.LOGS).filter(l => !l.read).length;
    },
    markAllLogsRead: function() {
      const logs = get(KEYS.LOGS);
      logs.forEach(l => l.read = true);
      set(KEYS.LOGS, logs, 'logs');
    },

    // Ward Master Management
    getWards: () => get(KEYS.WARDS),
    addWard: function(ward) {
      const wards = get(KEYS.WARDS);
      wards.push(ward);
      set(KEYS.WARDS, wards, 'wards');
      this.addLog(`Ward master created: ${ward.name} (capacity ${ward.capacity})`, 'info');
    },
    updateWard: function(id, updates) {
      const wards = get(KEYS.WARDS);
      const index = wards.findIndex(w => w.id === id);
      if (index !== -1) {
        wards[index] = { ...wards[index], ...updates };
        set(KEYS.WARDS, wards, 'wards');
        this.addLog(`Ward master updated: ${wards[index].name}`, 'info');
      }
    },
    removeWard: function(id) {
      const wards = get(KEYS.WARDS);
      const ward = wards.find(w => w.id === id);
      const beds = get(KEYS.BEDS);
      if (ward && beds.some(b => b.ward === ward.name)) {
        return { ok: false, message: 'Cannot remove a ward that still has beds assigned to it.' };
      }
      set(KEYS.WARDS, wards.filter(w => w.id !== id), 'wards');
      this.addLog(`Ward master removed: ${ward ? ward.name : id}`, 'warning');
      return { ok: true };
    },

    // Bed Master Management (add/remove physical beds; allocateBed above handles assignment)
    addBed: function(bed) {
      const beds = get(KEYS.BEDS);
      beds.push({ ...bed, status: 'available', patientId: null });
      set(KEYS.BEDS, beds, 'beds');
      this.addLog(`Bed master created: ${bed.id} in ${bed.ward}`, 'info');
    },
    removeBed: function(id) {
      const beds = get(KEYS.BEDS);
      const bed = beds.find(b => b.id === id);
      if (bed && bed.status !== 'available') {
        return { ok: false, message: 'Cannot remove a bed that is currently occupied. Discharge or reallocate the patient first.' };
      }
      set(KEYS.BEDS, beds.filter(b => b.id !== id), 'beds');
      this.addLog(`Bed master removed: ${id}`, 'warning');
      return { ok: true };
    },

    // Lab Module
    getLabOrders: () => get(KEYS.LAB_ORDERS),
    addLabOrder: function(order) {
      const orders = get(KEYS.LAB_ORDERS);
      orders.unshift(order);
      set(KEYS.LAB_ORDERS, orders, 'labOrders');
      this.addLog(`Lab test ordered: ${order.testName} for ${order.patientName}`, 'info');
    },
    recordSampleCollection: function(id, collectedBy) {
      const orders = get(KEYS.LAB_ORDERS);
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index].status = 'sample_collected';
        orders[index].collectedBy = collectedBy;
        orders[index].collectedDate = new Date().toISOString().substring(0, 10);
        set(KEYS.LAB_ORDERS, orders, 'labOrders');
        this.addLog(`Sample collected for ${orders[index].testName} (${orders[index].patientName})`, 'info');
      }
    },
    enterLabResult: function(id, result) {
      const orders = get(KEYS.LAB_ORDERS);
      const index = orders.findIndex(o => o.id === id);
      if (index !== -1) {
        orders[index].status = 'result_ready';
        orders[index].result = result;
        orders[index].resultDate = new Date().toISOString().substring(0, 10);
        set(KEYS.LAB_ORDERS, orders, 'labOrders');

        // Push result to patient's clinical timeline so doctors see it on the EHR
        const patients = get(KEYS.PATIENTS);
        const patient = patients.find(p => p.id === orders[index].patientId);
        if (patient) {
          patient.history = patient.history || [];
          patient.history.push({
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            type: 'lab_result',
            author: 'Lab Diagnostics',
            text: `${orders[index].testName} result: ${result}`
          });
          localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
          publish('patients');
        }
        this.addLog(`Lab result entered for ${orders[index].testName} (${orders[index].patientName})`, 'success');
      }
    },

    // Consultation Recording
    getConsultations: () => get(KEYS.CONSULTATIONS),
    addConsultation: function(consult) {
      const list = get(KEYS.CONSULTATIONS);
      list.unshift(consult);
      set(KEYS.CONSULTATIONS, list, 'consultations');

      // Append to patient's EHR timeline as well
      const patients = get(KEYS.PATIENTS);
      const patient = patients.find(p => p.id === consult.patientId);
      if (patient) {
        patient.history = patient.history || [];
        patient.history.push({
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'consultation',
          author: consult.doctorName,
          text: consult.notes
        });
        localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
        publish('patients');
      }
      this.addLog(`Consultation recorded for ${consult.patientName} by ${consult.doctorName}`, 'info');
    },

    // Insurance Claims
    getClaims: () => get(KEYS.CLAIMS),
    addClaim: function(claim) {
      const claims = get(KEYS.CLAIMS);
      claims.unshift(claim);
      set(KEYS.CLAIMS, claims, 'claims');
      this.addLog(`Insurance claim submitted: ${claim.id} for ${claim.patientName} ($${claim.claimAmount.toFixed(2)})`, 'info');
    },
    updateClaimStatus: function(id, status) {
      const claims = get(KEYS.CLAIMS);
      const index = claims.findIndex(c => c.id === id);
      if (index !== -1) {
        claims[index].status = status;
        set(KEYS.CLAIMS, claims, 'claims');
        this.addLog(`Insurance claim ${id} marked as ${status}`, status === 'rejected' ? 'warning' : 'success');
      }
    },

    // Pharmacy Dispensing
    dispenseMedicine: function(itemId, patientId, patientName, quantity) {
      const inv = get(KEYS.INVENTORY);
      const item = inv.find(i => i.id === itemId);
      if (!item) return { ok: false, message: 'Item not found.' };
      if (item.stock < quantity) return { ok: false, message: `Not enough stock. Only ${item.stock} ${item.unit} available.` };

      item.stock -= quantity;
      set(KEYS.INVENTORY, inv, 'inventory');

      if (patientId) {
        const patients = get(KEYS.PATIENTS);
        const patient = patients.find(p => p.id === patientId);
        if (patient) {
          patient.history = patient.history || [];
          patient.history.push({
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            type: 'dispensed',
            author: 'Pharmacy',
            text: `Dispensed ${quantity} ${item.unit} of ${item.name}.`
          });
          localStorage.setItem(KEYS.PATIENTS, JSON.stringify(patients));
          publish('patients');
        }
      }

      if (item.stock < item.minStock) {
        this.addLog(`Dispensed ${quantity} ${item.unit} of ${item.name} to ${patientName || 'stock room'}. LOW STOCK WARNING: ${item.stock} ${item.unit} remaining.`, 'warning');
      } else {
        this.addLog(`Dispensed ${quantity} ${item.unit} of ${item.name} to ${patientName || 'stock room'}.`, 'info');
      }
      return { ok: true };
    },

    // Role Management (Cross Module / RBAC)
    updateUserRole: function(email, role) {
      const users = get(KEYS.USERS);
      const user = users.find(u => u.email === email);
      if (user) {
        user.role = role;
        set(KEYS.USERS, users, 'users');
        this.addLog(`User role updated: ${user.name} is now ${role}`, 'warning');
        return true;
      }
      return false;
    }
  };
})();
