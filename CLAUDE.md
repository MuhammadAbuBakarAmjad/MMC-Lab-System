# Mashallah Medical Complex — Lab Report System

## What This Is
A web-based laboratory report management system replacing Excel-based workflows.
Local LAN deployment only. No internet required. Single lab, single location.

## Project Status
All 7 phases are complete and the system is production-ready.
Read the docs in /docs before making any changes.

## Read These First (in order)
1. docs/PROJECT_OVERVIEW.md
2. docs/DATABASE_SCHEMA.md
3. docs/FEATURES.md
4. docs/UI_UX.md
5. docs/NON_FUNCTIONAL.md
6. docs/TEST_TEMPLATES_SEED.json
7. docs/IMPLEMENTATION_PLAN.md

---

## Skills to Use

Run these before the relevant work:

- `/frontend-design` — before building or changing any page or component
- `/pg` — before writing any SQL, schema, or query
- `/simplify` — after completing any significant change
- `/code-review` — before committing a set of changes

---

## Tech Stack
- Frontend: React + Vite (NOT Create React App)
- Styling: Tailwind CSS utility classes only
- Backend: Node.js + Express
- Database: PostgreSQL with JSONB columns (NOT SQLite — non-negotiable)
- PDF/Print: window.print() + CSS @media print (NO external PDF libraries)
- Package manager: npm

## Do NOT Introduce
- SQLite or any other database
- Any CSS-in-JS (styled-components, Emotion)
- Redux or Zustand — use React state and props
- Any PDF generation library (jsPDF, Puppeteer, etc.)
- Axios — use native fetch()
- TypeScript — plain JavaScript only
- Any UI component library (Material UI, Ant Design, Chakra) — Tailwind only

---

## Code Style — Human-Readable, Maintainable

This codebase will be maintained by humans who are not the original author.
Write code a junior developer can read, understand, and modify without asking questions.

### Naming
- Variables and functions: say exactly what they do
  GOOD: `getPatientsByPhone`, `formatDateForDisplay`, `isReportFinalized`
  BAD:  `getData`, `fmt`, `check`
- No single-letter variables outside of simple loops (i, j are fine in for loops)
- Boolean variables start with: is, has, can, should
  GOOD: `isLoading`, `hasResults`, `canEdit`
  BAD:  `loading`, `results`, `edit`

### Functions
- One function does one thing. If you have to use "and" to describe it, split it.
- Max ~30 lines per function. If it's longer, extract named helpers.
- Name the helper after what it does, not where it's used.
  GOOD: `validateLabNumber()`, `buildReportPayload()`, `groupResultsByCategory()`
  BAD:  `helper1()`, `processData()`, `doStuff()`

### Comments
- Comment the WHY, not the WHAT. Code shows what. Comments explain why.
  GOOD: `// lab_no stored as VARCHAR so client can add prefixes like "2026-001" later`
  BAD:  `// set lab_no to string`
- Every function gets a one-line comment above it explaining its purpose
- Complex business logic (e.g. grouping tests by category for report sections) gets a comment block

### File and Folder Structure
- One concern per file. Don't mix API calls, business logic, and UI in the same file.
- Route files handle HTTP only (parse request, call db function, send response)
- DB files handle queries only — no business logic, no HTTP
- Components handle rendering only — no fetch(), no business logic
- utils/ for pure functions that don't belong to a specific domain

### React Components
- Props should be obvious from their names — no single-letter props
- If a component needs more than 5 props, consider splitting it
- Destructure props at the top of the component, not inline
- Keep JSX readable — if a conditional is complex, extract it to a variable above the return

### Error Handling
- Every catch block logs the error AND returns something meaningful
- Never: `catch(e) {}` (swallowed error)
- Never: `catch(e) { return null }` (silent failure)
- Always: `catch(error) { console.error('Failed to load patients:', error); setError('Could not load patients. Please try again.'); }`

### No Cleverness
- Prefer 3 readable lines over 1 clever line
- No chained ternaries (a ? b : c ? d : e) — use if/else or early returns
- No overly abstract helpers that need documentation to understand
- If you're proud of how clever a piece of code is, rewrite it to be boring

---

## Project Structure
```
lab-system/
├── client/               ← React + Vite
│   ├── src/
│   │   ├── pages/        ← one file per route
│   │   ├── components/   ← reusable components
│   │   ├── api/          ← ALL fetch() calls go here, never in components
│   │   └── utils/        ← date formatting, helpers
│   └── vite.config.js    ← proxy /api/* to localhost:3000
├── server/               ← Express
│   ├── routes/           ← one file per resource
│   ├── db/
│   │   ├── index.js      ← exports pg Pool (single instance, imported everywhere)
│   │   ├── init.js       ← drops/recreates tables and seeds data: node server/db/init.js
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── .env              ← DB credentials and config (not committed)
│   ├── .env.example      ← template for new installs
│   └── index.js
├── backup/
│   └── backup.js         ← nightly pg_dump, run via Windows Task Scheduler
├── backups/              ← runtime backup files, gitignored
├── docs/                 ← planning documents (read-only, do not modify)
├── start.bat             ← starts server + client dev mode, opens browser
├── update.bat            ← git pull + npm install + rebuild frontend
└── CLAUDE.md
```

---

## Database Rules
- Use parameterized queries ($1, $2) everywhere — never string concatenation in SQL
- All JSON columns are JSONB type
- Import pool from server/db/index.js — never create a new Pool in a route file
- ON DELETE CASCADE on report_results → reports
- Transactions for report create/update (insert report + results atomically)
- Every query function has a descriptive name: `getPatientById`, `searchPatients`, `createReport`

## API Rules
- Routes: /api/patients, /api/doctors, /api/templates, /api/reports, /api/settings, /api/dashboard
- All errors return: { "error": "Human readable message", "code": "MACHINE_CODE" }
- Never expose stack traces in error responses
- Every route has try/catch — no unhandled promise rejections
- Validate all inputs server-side — do not trust frontend-only validation

## Frontend Rules
- ALL fetch() calls go in src/api/*.js files — components import from api/, never call fetch directly
- Debounce all search inputs at 300ms before firing API calls
- Dates: store as YYYY-MM-DD, display as DD/MM/YYYY — use utils/dates.js for conversion
- Use React.lazy() and Suspense for page components
- Every list/table needs an empty state message
- Loading states: show spinner during fetch, disable submit buttons during API calls

---

## UI Rules
Run `/frontend-design` before building any page. Then follow these constraints:

- Color palette:
  Primary: #2563EB | Hover: #1D4ED8 | Success: #16A34A
  Warning: #D97706 | Danger: #DC2626 | Text: #111827
  Secondary text: #6B7280 | Border: #E5E7EB | Background: #F9FAFB
- Font: system font stack — no Google Fonts (app runs offline)
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- 8px spacing system — use Tailwind's default scale
- Every input has a <label> element — no placeholder-only labels
- Status badges: Draft = amber pill, Final = green pill
- Never two primary buttons side by side
- Sidebar width: 220px, collapses on tablet
- Clean clinical aesthetic — no gradients, no decorative shadows, no animations
- Dense data tables: 14px font, compact row padding — this is a data-entry app, not a landing page

## Print Rules (critical — read carefully)
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
Print view = zero UI chrome. Sidebar gone. Buttons gone. Report only.

---

## Business Logic Rules
- "Self" doctor (id=1) is seeded for walk-in patients — doctor_id is never NULL
- lab_no: auto-increment from MAX+1, stored as VARCHAR, user-editable, must be unique
- Age stored as VARCHAR ("35 Years", "6 Months") not integer
- Final reports cannot be edited — enforce on backend (return 403) AND hide Edit button on frontend
- Report sections = tests grouped by category field — NOT a separate DB table
- result_data shape depends on report_type: standard | qualitative | descriptive | hormones
  (see DATABASE_SCHEMA.md for exact JSON shapes)

---

## Out of Scope — Do Not Build
- User authentication / login
- Billing or payments
- File/image uploads
- Cross Match test
- Widal Test
- Multi-branch support
- SMS/WhatsApp delivery

---

## /compact Policy
When summarizing this conversation preserve:
- All database schema decisions and any changes made
- API endpoint signatures and their validation rules
- Any bugs found and how they were fixed
- List of all files created or modified
- Any deviations from the spec and why
Summarize exploration and failed attempts briefly.

---

## If Something Is Unclear
Check FEATURES.md first. Make the simplest, most readable choice. Add a TODO comment.
Do not invent features. Do not expand scope. Do not add packages not listed above.
