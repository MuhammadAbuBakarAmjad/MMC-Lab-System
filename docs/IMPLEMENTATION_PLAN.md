# Implementation Plan

## How to Use This Document
Build in phases, in order. Do not start Phase 2 before Phase 1 passes all its tests.
Each phase ends with a testing checklist — verify every item before moving on.
Read ALL documents before writing any code:
- PROJECT_OVERVIEW.md
- DATABASE_SCHEMA.md
- FEATURES.md
- UI_UX.md
- NON_FUNCTIONAL.md
- TEST_TEMPLATES_SEED.json

---

## Phase 1 — Project Scaffold & Database

### What to Build

**1. Project structure**
Create the following folder structure exactly:
```
lab-system/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/
│   │   └── utils/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── server/
│   ├── routes/
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── index.js
│   └── package.json
├── backup/
│   └── backup.js
└── README.md
```

**2. Backend setup**
- Initialize Node.js project in /server
- Install: express, pg, cors, dotenv
- Create server/index.js with Express app, CORS enabled, JSON body parser
- Create server/db/index.js that exports a pg Pool using .env variables
- Set up .env with: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, PORT

**3. Database schema**
Create server/db/schema.sql with all 6 tables and all indexes exactly as defined in DATABASE_SCHEMA.md:
- lab_settings
- patients
- doctors
- test_templates
- reports
- report_results

**4. Seed data**
Create server/db/seed.sql that:
- Inserts the single lab_settings row
- Inserts the "Self" doctor (id will be 1)
- Inserts ALL test templates from TEST_TEMPLATES_SEED.json with their full template_data

Create a script server/db/init.js that:
- Drops and recreates all tables (runs schema.sql)
- Runs seed.sql
- Logs success/failure clearly
- Usage: `node server/db/init.js`

**5. Frontend setup**
- Initialize React + Vite project in /client
- Install: react-router-dom, axios (or use fetch)
- Install Tailwind CSS and configure it
- Create basic App.jsx with React Router set up
- Create placeholder page components for all 5 routes:
  - /dashboard → Dashboard.jsx
  - /reports → ReportsList.jsx
  - /reports/new → NewReport.jsx
  - /reports/:id → ViewReport.jsx
  - /settings → Settings.jsx
- Create a Layout.jsx component with the sidebar and main content area
- Sidebar must have: lab name at top, nav links (Dashboard, Reports, Patients, Settings), "New Report" button

**6. Vite proxy**
Configure vite.config.js to proxy /api/* to http://localhost:3000 so frontend can call /api/... without CORS issues in development.

### Phase 1 Tests — Verify All Before Proceeding
- [ ] `node server/db/init.js` runs without errors
- [ ] Database has all 6 tables created
- [ ] lab_settings has exactly 1 row
- [ ] doctors table has 1 row ("Self")
- [ ] test_templates table has all templates seeded (count should be 30+)
- [ ] Express server starts on PORT from .env
- [ ] GET http://localhost:3000/api/health returns { status: "ok" }
- [ ] Frontend starts with `npm run dev` in /client
- [ ] Browser shows the app at http://localhost:5173
- [ ] Sidebar is visible with all nav links
- [ ] Clicking nav links navigates to correct placeholder pages
- [ ] No console errors on any page

---

## Phase 2 — Patients & Doctors API + UI

### What to Build

**1. Patients API (server/routes/patients.js)**
```
GET    /api/patients/search?q={query}  → search by name, phone, or id
GET    /api/patients/:id               → get single patient
GET    /api/patients/:id/reports       → get all reports for patient (id, lab_no, date, doctor name, test names, status)
POST   /api/patients                   → create patient
PUT    /api/patients/:id               → update patient
```

Search query logic:
```sql
SELECT * FROM patients
WHERE name ILIKE '%$1%'
   OR phone LIKE '%$1%'
   OR (id::text = $1)
LIMIT 10
```

**2. Doctors API (server/routes/doctors.js)**
```
GET    /api/doctors/search?q={query}   → search by name or phone
GET    /api/doctors                    → list all doctors
POST   /api/doctors                    → create doctor
```

**3. Patients Page (client/src/pages/Patients.jsx)**
- Search bar at top
- Table of all patients: ID | Name | Age | Gender | Phone | Reports Count | Action
- Clicking a patient name → /patients/:id

**4. Patient Detail Page (client/src/pages/PatientDetail.jsx)**
- Patient info card: Name, Age, Gender, Phone, ID
- Edit button → inline edit form
- Report history table: Lab No | Date | Referred By | Status | View button
- Sorted newest first

**5. Reusable PatientSearch component (client/src/components/PatientSearch.jsx)**
- Text input with debounced search (300ms)
- Dropdown showing results: Name (bold) + ID + Phone
- "Add New Patient" option at bottom if no exact match
- Inline new patient form (not a modal, not a new page)
- Selected state: shows chip with patient name + X to deselect
- This component will be reused on the New Report page

**6. Reusable DoctorSearch component (client/src/components/DoctorSearch.jsx)**
- Same pattern as PatientSearch
- "Self" always appears first in results
- "Add New Doctor" inline form

### Phase 2 Tests — Verify All Before Proceeding
- [ ] GET /api/patients/search?q=ali returns patients matching "ali" in name
- [ ] GET /api/patients/search?q=0300 returns patients matching that phone prefix
- [ ] GET /api/patients/search?q=5 returns patient with id=5
- [ ] POST /api/patients creates a patient and returns it with id
- [ ] POST /api/patients with missing name returns 400 error
- [ ] POST /api/patients with missing phone returns 400 error
- [ ] GET /api/doctors/search?q=self returns the Self doctor
- [ ] PatientSearch component shows dropdown after typing 2+ characters
- [ ] PatientSearch dropdown shows name, ID, and phone for each result
- [ ] Selecting a patient shows chip and hides dropdown
- [ ] Clicking X on chip clears selection
- [ ] "Add New Patient" appears when no results found
- [ ] Submitting Add New Patient form creates patient and auto-selects them
- [ ] Patient detail page shows report history (empty state if no reports)
- [ ] All API calls use parameterized queries (no string concatenation in SQL)

---

## Phase 3 — Test Templates API + Settings Page

### What to Build

**1. Test Templates API (server/routes/templates.js)**
```
GET  /api/templates           → return all active templates grouped by category
GET  /api/templates/all       → return all templates including inactive (for settings)
POST /api/templates           → create new template
PUT  /api/templates/:id       → update template (name, category, is_active)
```

Response format for GET /api/templates (grouped):
```json
[
  {
    "category": "HAEMATOLOGY",
    "templates": [
      { "id": 1, "test_name": "CBC", "report_type": "standard", "template_data": {...}, "display_order": 1 }
    ]
  }
]
```

**2. Settings API (server/routes/settings.js)**
```
GET  /api/settings   → return the single lab_settings row
PUT  /api/settings   → update lab_settings (always updates row with id=1)
```

**3. Settings Page (client/src/pages/Settings.jsx)**

Section 1 — Lab Information:
- Form fields: Lab Name, Address (textarea), Department, Footer Note (textarea)
- Save button
- Success message on save

Section 2 — Test Templates:
- Table: Test Name | Category | Type | Active (toggle) | Edit
- "Add New Template" button opens a form:
  - Test Name (text)
  - Category (dropdown of existing categories + "New Category" text input)
  - Report Type (dropdown: standard / qualitative / descriptive / hormones)
  - Template Data (raw JSON textarea — advanced, with a note "Edit with care")
  - Save button
- Toggling active/inactive immediately calls PUT /api/templates/:id

### Phase 3 Tests — Verify All Before Proceeding
- [ ] GET /api/templates returns templates grouped by category
- [ ] GET /api/templates only returns is_active = true templates
- [ ] GET /api/templates/all returns all templates including inactive
- [ ] GET /api/settings returns the lab settings row
- [ ] PUT /api/settings updates lab name, verify it persists after page refresh
- [ ] Settings page displays current lab info correctly
- [ ] Saving settings shows success message
- [ ] Templates table shows all templates with correct type labels
- [ ] Toggling a template inactive removes it from GET /api/templates (active only)
- [ ] Toggling it back active makes it appear again

---

## Phase 4 — Create Report (Core Feature)

This is the most complex phase. Read FEATURES.md section "Page 3: Create New Report" carefully before starting.

### What to Build

**1. Reports API — creation endpoints (server/routes/reports.js)**
```
GET  /api/reports/next-lab-no   → returns next available lab number (MAX + 1)
POST /api/reports               → create report with results
```

POST /api/reports body:
```json
{
  "lab_no": "1234",
  "patient_id": 5,
  "doctor_id": 2,
  "report_date": "2026-06-08",
  "status": "draft",
  "results": [
    {
      "template_id": 1,
      "display_order": 1,
      "result_data": {
        "fields": [
          { "name": "Haemoglobin", "result": "13.5", "unit": "g/dl", "normal_male": "13.0-17.5", "normal_female": "11.5-14.5" }
        ]
      }
    }
  ]
}
```

Validation on POST /api/reports:
- lab_no required and must be unique
- patient_id required and must exist
- At least one result required
- Return 400 with clear error message if validation fails

The insert must be a transaction — insert report row first, then insert all result rows. If any result insert fails, roll back the entire transaction.

**2. NewReport Page (client/src/pages/NewReport.jsx)**

Build in this exact order:

Step A — Patient + Doctor row at top
- PatientSearch component (reuse from Phase 2)
- DoctorSearch component (reuse from Phase 2)
- Report Date (date input, defaults to today)
- Lab No (text input, pre-filled from GET /api/reports/next-lab-no, editable)

Step B — Test Picker
- Fetch GET /api/templates on load
- Render categories as collapsible accordion sections
- All collapsed by default
- Each test has a checkbox
- Checking a test renders its result entry form immediately below it

Step C — Result Entry Forms
Create a component for each report_type. Each component receives the template_data and calls back with result_data when values change.

ResultForm_Standard.jsx:
- Table with columns: Test Name | Result (input) | Unit (static) | Normal Value (static)
- Result is a number input
- Tab key moves to next result input within the table

ResultForm_Qualitative.jsx:
- Table with columns: Test Name | Result (dropdown)
- Dropdown options come from template_data.fields[n].options

ResultForm_Descriptive.jsx:
- Renders each sub-section as a sub-heading
- Each field renders as dropdown or text input based on field.type
- Unit shown next to text inputs if field.unit exists

ResultForm_Hormones.jsx:
- Table with columns: Test Name | Result (number input) | Unit (static) | Normal Value (multi-line text, pre-wrapped)

Step D — Action Buttons
- "Save as Draft" → POST /api/reports with status=draft → stay on page, show success toast, update URL to /reports/:id/edit
- "Finalize Report" → POST /api/reports with status=final → redirect to /reports/:id

### Phase 4 Tests — Verify All Before Proceeding
- [ ] GET /api/reports/next-lab-no returns a number (1 if no reports exist)
- [ ] Lab No field pre-fills with next lab number on page load
- [ ] Patient search works and selects patient
- [ ] Doctor search works, Self is first option
- [ ] Test template categories render as collapsible sections
- [ ] Clicking a category header expands/collapses it
- [ ] Checking CBC renders the CBC result entry table with all 11 fields
- [ ] Each CBC field has a number input
- [ ] Tab key moves between result inputs
- [ ] Checking HBsAg renders a dropdown with Reactive/Non-Reactive options
- [ ] Checking Urine R/E renders sub-sections (Physical, Chemical, Microscopic)
- [ ] Urine R/E dropdowns show correct options (e.g. Color options list)
- [ ] POST /api/reports with valid data returns 201 with the created report
- [ ] POST /api/reports with duplicate lab_no returns 400 with clear error
- [ ] POST /api/reports with missing patient_id returns 400
- [ ] Saving as Draft stays on page and shows success message
- [ ] Finalizing redirects to /reports/:id
- [ ] If DB insert fails mid-way, entire report is rolled back (test by temporarily breaking a result insert)
- [ ] All result data is correctly stored as JSONB in report_results

---

## Phase 5 — View Report + Print

### What to Build

**1. Reports API — fetch endpoints**
```
GET  /api/reports              → paginated list with filters
GET  /api/reports/:id          → single report with patient, doctor, and all results joined
```

GET /api/reports query params: `?page=1&limit=20&q=searchterm&from=date&to=date&doctor_id=x&status=draft`

GET /api/reports/:id response shape:
```json
{
  "id": 1,
  "lab_no": "1234",
  "report_date": "2026-06-08",
  "status": "final",
  "patient": { "id": 5, "name": "Muhammad Ali", "age": "35 Years", "gender": "Male", "phone": "03001234567" },
  "doctor": { "id": 2, "name": "Dr. Kamran Ahmed" },
  "results": [
    {
      "id": 1,
      "template_id": 1,
      "template_name": "CBC",
      "category": "HAEMATOLOGY",
      "report_type": "standard",
      "display_order": 1,
      "result_data": { ... }
    }
  ]
}
```

**2. ViewReport Page (client/src/pages/ViewReport.jsx)**

This page has TWO modes:
- Screen mode: shows report + action buttons (Edit, Print)
- Print mode: shows ONLY the report, no buttons, no sidebar

Layout structure:
```jsx
<div className="no-print">  {/* action buttons — hidden on print */}
  <Button>Edit</Button>       {/* only if status === 'draft' */}
  <Button>Print / Save PDF</Button>  {/* calls window.print() */}
  <Link>Back to Reports</Link>
</div>

<div className="report-container">
  <ReportHeader />       {/* lab name, patient info */}
  <ReportBody />         {/* sections + result tables */}
  <ReportFooter />       {/* footer note + signature line */}
</div>
```

ReportHeader component:
```
MASHALLAH MEDICAL COMPLEX, MULTAN    (from lab_settings)
Department of Pathology              (from lab_settings)
────────────────────────────────────
Patient Name: [name]     Lab No: [lab_no]
Age: [age]  Sex: [gender]  Date: [DD/MM/YYYY]
Referred By: Dr. [doctor_name]
────────────────────────────────────
```

ReportBody component:
- Group results by category (sort by display_order)
- For each category: render section heading + appropriate result display component

ResultDisplay_Standard: table with TEST NAME | REPORT | UNIT | NORMAL VALUE columns
ResultDisplay_Qualitative: table with TEST NAME | REPORT columns
ResultDisplay_Descriptive: sub-sections with two-column layout
ResultDisplay_Hormones: table with TEST NAME | REPORT | UNIT | NORMAL VALUE (multi-line)

Normal value display rule:
- If normal_male === normal_female: show single value
- If different: show "M: [value]" newline "F: [value]"
- For hormones: show normal_value_text as-is with line breaks preserved (white-space: pre-line)

ReportFooter component:
```
────────────────────────────────────
[footer_note]              Signature: __________
```

Print CSS (in index.css or a separate print.css):
```css
@media print {
  .no-print { display: none !important; }
  .sidebar  { display: none !important; }
  body { margin: 0; background: white; color: black; }
  .report-section { page-break-inside: avoid; }
  thead { display: table-header-group; }
  tfoot { display: table-footer-group; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
```

**3. ReportsList Page (client/src/pages/ReportsList.jsx)**
- Search input (debounced 300ms) → searches lab_no and patient name/phone simultaneously
- Date range filter (from / to)
- Doctor filter dropdown
- Status filter dropdown
- Table: Lab No | Patient Name | Age | Gender | Referred By | Date | Status | Actions
- Actions: View button (all reports) + Edit button (draft only) + Delete button with confirmation
- Pagination: 20 per page, prev/next buttons

### Phase 5 Tests — Verify All Before Proceeding
- [ ] GET /api/reports returns paginated list (20 per page)
- [ ] GET /api/reports?q=ali filters by patient name
- [ ] GET /api/reports?q=1234 filters by lab_no
- [ ] GET /api/reports?status=draft returns only drafts
- [ ] GET /api/reports?from=2026-01-01&to=2026-06-30 filters by date range
- [ ] GET /api/reports/:id returns full report with patient, doctor, and all results
- [ ] Report view shows lab name from lab_settings (not hardcoded)
- [ ] Report view shows patient name, age, gender, lab_no, date, doctor
- [ ] Date displays as DD/MM/YYYY (not ISO format)
- [ ] CBC results display with all 11 rows in correct table format
- [ ] Qualitative results show as a clean two-column table
- [ ] Urine R/E displays three sub-sections correctly
- [ ] Hormones normal value shows with line breaks preserved
- [ ] Normal value shows M:/F: split when they differ
- [ ] Normal value shows single value when M and F are the same
- [ ] Print button calls window.print()
- [ ] On print: sidebar is hidden, action buttons are hidden
- [ ] On print: only report content is visible
- [ ] Edit button is visible for draft reports
- [ ] Edit button is NOT visible for final reports
- [ ] Delete button shows confirmation dialog before deleting
- [ ] After deletion, report is gone from the list
- [ ] Pagination works: next/prev buttons, correct page count

---

## Phase 6 — Dashboard + Edit Report

### What to Build

**1. Dashboard API**
```
GET /api/dashboard/stats   → { reports_today, reports_this_month, total_patients, total_doctors }
GET /api/dashboard/recent  → last 10 reports (lab_no, patient name, age, gender, doctor, date, status)
GET /api/dashboard/top-doctors → top 5 referring doctors this month with report count
```

**2. Dashboard Page (client/src/pages/Dashboard.jsx)**
- 4 stat cards in a row: Reports Today | Reports This Month | Total Patients | Total Doctors
- Recent Reports table (last 10, with View button per row)
- Top Referring Doctors (this month) — ranked list

**3. Edit Report**
```
GET /api/reports/:id        → already built in Phase 5
PUT /api/reports/:id        → update report (only allowed if status = draft)
```

PUT /api/reports/:id:
- Same body as POST
- Must validate status is draft — return 403 if trying to edit a final report
- Update report row and replace all result rows (delete old results, insert new ones in a transaction)

EditReport Page (client/src/pages/EditReport.jsx):
- Same UI as NewReport page
- Pre-populate all fields from the existing report data
- Pre-check the correct tests and pre-fill all result values
- "Save Draft" and "Finalize" buttons same as NewReport

### Phase 6 Tests — Verify All Before Proceeding
- [ ] GET /api/dashboard/stats returns correct counts
- [ ] Reports Today count is accurate (test by creating a report today)
- [ ] GET /api/dashboard/top-doctors returns correct ranking
- [ ] Dashboard stat cards display correct numbers
- [ ] Recent reports table shows correct last 10 reports
- [ ] Clicking patient name in recent reports navigates to patient detail
- [ ] PUT /api/reports/:id updates the report correctly
- [ ] PUT /api/reports/:id with status=final returns 403
- [ ] Edit page pre-fills patient, doctor, date, lab_no correctly
- [ ] Edit page pre-checks correct test checkboxes
- [ ] Edit page pre-fills all result values
- [ ] Saving edited report updates correctly in database
- [ ] Finalizing from edit redirects to view page with final status

---

## Phase 7 — Backup Script + README

### What to Build

**1. Backup script (backup/backup.js)**
```javascript
// What it does:
// 1. Reads DB config from server/.env
// 2. Runs: pg_dump -U [user] -h [host] [dbname] > ./backups/backup_YYYY-MM-DD.sql
// 3. Deletes backup files older than 30 days from ./backups/
// 4. If GOOGLE_DRIVE_BACKUP_PATH is set in .env, copies latest backup there too
// 5. Logs all actions with timestamps to console

// Run manually: node backup/backup.js
// Set up nightly: Windows Task Scheduler → runs node backup/backup.js at 2:00 AM
```

**2. README.md**

Must cover:
1. Prerequisites: Node.js 20+, PostgreSQL 18+
2. Installation:
   - Clone repo
   - `cd server && npm install`
   - `cd client && npm install`
   - Create server/.env from the template
   - Create the labsystem database in PostgreSQL
   - `node server/db/init.js` to set up tables and seed data
3. Running the app:
   - `node server/index.js` (or `npm start`)
   - `npm run dev` in /client for development
   - Production: how to build frontend with `npm run build` and serve it from Express
4. Accessing from other computers on the network:
   - Find server IP with `ipconfig`
   - Other computers visit http://[server-ip]:3000
5. Nightly backup setup (Windows Task Scheduler — step by step with screenshots described)
6. Restoring from backup (exact commands)
7. Adding new test templates (via Settings page)

### Phase 7 Tests — Verify All Before Proceeding
- [ ] `node backup/backup.js` runs without error
- [ ] A .sql file is created in ./backups/ with today's date
- [ ] The backup file is not empty (has actual SQL in it)
- [ ] Running backup twice in a day creates only one file (overwrites or skips)
- [ ] README installation steps work from scratch on a clean machine
- [ ] Frontend build works: `npm run build` in /client succeeds
- [ ] Express serves the built frontend from /client/dist when NODE_ENV=production
- [ ] App works correctly when accessed from a different device on the same network

---

## General Rules for the Agent

1. **Read all planning docs before writing any code.** Do not start from memory.

2. **Use parameterized queries everywhere.** Never concatenate user input into SQL strings.

3. **One db.js file exports the pool.** All route files import from it. Never create a new Pool in a route file.

4. **All API calls go in client/src/api/*.** Components never write fetch() or axios directly.

5. **Complete each phase fully before starting the next.** Do not partially build phases.

6. **Run the test checklist at the end of each phase.** Fix failures before proceeding.

7. **Do not add features not in the spec.** Scope creep kills projects. If something seems missing, ask — do not assume.

8. **Handle errors.** Every API route needs try/catch. Every async React function needs error handling. Never leave unhandled promise rejections.

9. **Commit after each passing phase.** Use git. Commit message: "Phase X complete — all tests passing"

10. **If the database schema needs to change**, update DATABASE_SCHEMA.md first, then make the change. Do not silently diverge from the spec.
