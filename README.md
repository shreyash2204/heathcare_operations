# AuraCare OS — Clinical Operations Hub

A single-page healthcare operations platform for managing patients, staff, beds, appointments, and billing — styled with a **Glassmorphism + Flat UI** hybrid design system.

This README exists to help you navigate the codebase: what each file does, what each page/component is, and how data flows through the app.

---

## 1. Design System

The UI mixes two styles intentionally:

- **Glassmorphism** — translucent, blurred panels (sidebar, header, cards, modals, toasts) that sit on top of soft gradient backgrounds, giving depth without heavy shadows.
- **Flat UI** — buttons, badges, tables, and form controls stay flat and solid so text stays legible and the interface stays fast to scan in a clinical setting.

### Color Palette

| Swatch | Hex | CSS Variable | Used for |
|---|---|---|---|
| 🟦 Navy | `#01406D` | `--palette-navy` / `--primary` | Headings, primary buttons, active nav, icons |
| 🟩 Teal | `#01B4BA` | `--palette-teal` / `--secondary` | Accents, success states, charts |
| ⬜ Ice White | `#F5FEFE` | `--palette-ice` / `--bg-app` | App background, light surfaces |
| 🟧 Orange | `#FF7A0F` | `--palette-orange` / `--accent` | Warnings, highlights, alerts |

All variables live at the top of `css/base.css` under `:root`. A `body.theme-dark` block re-maps the same variables for dark mode (toggled from the header moon/sun icon).

### Glass Surfaces

Defined once as `--glass-blur: blur(22px) saturate(150%)` and applied via `backdrop-filter` to:
`app-sidebar`, `app-header`, `.card`, `.telemetry-card`, `.table-container`, `.modal-wrapper`, `.toast`, `.auth-card`.

---

## 2. How Navigation Works

This is a **single-page app (SPA)** — there is only one HTML file (`index.html`), and the left sidebar links use hash routes (`#dashboard`, `#patients`, etc.). `js/app.js` listens for `hashchange`, matches the hash to a **View module**, and injects that view's HTML into `#app-viewport`. So "different pages" are separate JS view modules rendered into the same shell — no full page reloads.

### Pages / Nav Items

| Nav Label | Hash Route | View File | Access |
|---|---|---|---|
| Operations Center | `#dashboard` | `js/views/dashboard.js` | Doctor + Admin (different layouts per role) |
| Patients (EHR) | `#patients` | `js/views/patients.js` | Doctor + Admin |
| Lab Diagnostics | `#lab` | `js/views/lab.js` | Doctor + Admin |
| Beds & Supply Map | `#resources` | `js/views/resources.js` | Admin only |
| Staff Shift Roster | `#staff` | `js/views/staff.js` | Doctor + Admin |
| Consults Planner | `#appointments` | `js/views/appointments.js` | Admin only |
| Billing Operations | `#billing` | `js/views/billing.js` | Admin only |

There's also a standalone **`landing.html`** marketing/entry page (not part of the SPA routing) that links into `index.html`.

Role-based visibility is controlled in `app.js` via `DOCTOR_ROUTES` — doctors only see Dashboard, Patients, and Staff in the sidebar; admins see everything.

**Demo logins** (shown on the auth screen):
- Admin: `admin@hospital.org` / `Admin123!`
- Doctor: `s.jenkins@hospital.org` / `Password1!`

---

## 3. Project Structure

```
healthcare-operations-platfomr-master/
├── index.html              # Single HTML shell: auth screen + app shell + script tags
├── landing.html            # Standalone marketing/entry page, links into index.html
├── css/
│   ├── base.css            # Design tokens (colors, fonts, shadows, glass blur), resets, backgrounds
│   ├── layout.css          # Sidebar, header, auth screen structural layout
│   └── components.css      # Cards, buttons, tables, forms, modals, toasts, beds, badges, notifications
├── js/
│   ├── store.js            # Data layer — localStorage-backed "database" + seed data
│   ├── utils.js             # Formatting helpers (currency, dates, age calc, etc.)
│   ├── app.js               # Router, auth gate, sidebar/theme/notifications wiring — the app's entry point
│   ├── components/
│   │   ├── charts.js        # Hand-rolled SVG line/bar chart renderer (no chart library)
│   │   ├── modal.js         # Reusable modal open/close/footer-button controller
│   │   └── toasts.js        # Success/warning/error toast notifications
│   └── views/
│       ├── dashboard.js     # Operations Center — KPIs, alerts, charts (role-aware)
│       ├── patients.js      # Patient EHR list, search/filter/pagination, profile editing, patient detail modal
│       ├── staff.js         # Staff roster, shift assignment, doctor schedule, role management
│       ├── resources.js     # Bed grid by ward, ward/bed master CRUD, pharmacy inventory & dispensing
│       ├── lab.js           # Lab test ordering, sample collection, result entry
│       ├── appointments.js  # Consult/surgery scheduling calendar, agenda cards, consultation recording
│       └── billing.js       # Invoices, payment status, revenue summary, insurance claims
└── data/
    └── dataset.json         # Reference/sample dataset (supplementary to store.js seed data)
```

---

## 4. Component Overview

### `js/app.js` — App Shell / Router
The brain of the SPA. Responsibilities:
- **Auth gate**: shows `#auth-container` or `#app-container` based on `sessionStorage` login state.
- **Routing**: maps `window.location.hash` → a view module's `.render()` method.
- **Role-based access**: hides nav items and blocks routes doctors shouldn't see.
- **Global events**: mobile sidebar toggle, logout, theme (light/dark) toggle, global header search (currently wired into the Patients view).

### `js/store.js` — Data Layer
Acts as a mock backend using `localStorage`. Seeds initial data for patients, staff, beds, appointments, inventory, billing, logs, and users on first load, then exposes getters/setters that every view reads/writes through. Includes a pub/sub (`subscribe('all', callback)`) so views can re-render reactively when data changes.

### `js/utils.js` — Helpers
Small stateless utilities: currency formatting, date formatting, age-from-DOB calculation, etc. Shared by every view.

### `js/components/charts.js`
A dependency-free SVG chart renderer (line/area charts) used on the Dashboard for trend visualizations — no external chart library required.

### `js/components/modal.js`
Generic modal controller: opens/closes the shared `.modal-overlay` / `.modal-wrapper`, sets title/body/footer content dynamically. Used for "Add Patient," "Edit Staff," "New Invoice," etc.

### `js/components/toasts.js`
Fires transient success/warning/error notifications in the bottom-right corner (`AuraCare.Toasts.success(...)`, `.warning(...)`, etc.).

### Views (Pages)

| View | What it shows |
|---|---|
| **Dashboard** (`dashboard.js`) | Role-specific landing page. Admins see hospital-wide KPIs, alert feed, and charts; doctors see a focused panel of their own schedule and patients. |
| **Patients** (`patients.js`) | Searchable, filterable, paginated patient table (EHR). Click a row to open a patient detail modal with vitals, medications, a visit timeline, and an **Edit Profile** action for demographic updates. |
| **Lab Diagnostics** (`lab.js`) | Order lab tests, record sample collection, and enter results — results are automatically published to the patient's EHR timeline. |
| **Staff** (`staff.js`) | Staff directory with role filter, shift roster management, per-doctor **weekly schedule/availability**, and admin **role management** (promote/demote doctor ↔ admin access). |
| **Resources** (`resources.js`) | Visual bed-availability grid grouped by ward (available / occupied / critical), a **Manage Wards & Beds** admin panel (ward/bed master CRUD), and a pharmaceutical inventory table with **Dispense** actions that deduct stock and log to the patient's record. |
| **Appointments** (`appointments.js`) | Agenda-style cards for scheduled consults/surgeries. Marking a consult "Done" opens a **Record Consultation** modal that saves clinical notes to the patient's EHR. |
| **Billing** (`billing.js`) | Invoice table with status filters and summary cards, plus an **Insurance Claims** tab for filing and approving/rejecting claims tied to an invoice. |

---

## 5. Backlog Coverage

All 25 user stories from `healthcare_pbl.csv` are now implemented:

- **Patient**: registration, search, profile editing, appointment booking, admission
- **Doctor & Staff**: doctor creation, weekly schedule management, consultation recording, prescriptions
- **Lab**: test ordering, sample collection, result entry
- **Wards & Beds**: ward master CRUD, bed master CRUD, bed allocation
- **Finance**: invoice generation, payment collection, insurance claim processing
- **Pharmacy**: inventory management, dispensing, stock replenishment
- **Cross-module**: login, role-based access + role management, notification center (header bell), KPI dashboard

---

## 5. Running the Project

This is a static site — no build step required.

```bash
# from the project root
open index.html          # macOS, quickest option
# or serve it locally (recommended, avoids some browser file:// restrictions)
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## 6. Extending the App

- **Add a new page/section**: create `js/views/yourview.js` following the existing `AuraCare.Views.X = { render() {...} }` pattern, register it in `ROUTES` inside `app.js`, and add a `<a href="#yourview" class="nav-item">` link in `index.html`.
- **Add a new data type**: extend `KEYS` and add seed/getter/setter functions in `store.js`.
- **Change the color palette**: edit the four `--palette-*` variables in `css/base.css` — every component inherits from them automatically, including dark mode.
