# LAB SYSTEM — MASTER INSTRUCTIONS FOR CLAUDE CODE

You are building a laboratory report management system for Mashallah Medical Complex, Multan, Pakistan.
This replaces their current Excel-based workflow.

## BEFORE WRITING A SINGLE LINE OF CODE

Read every document in this folder IN THIS ORDER:
1. PROJECT_OVERVIEW.md       — what you're building, scope, tech stack
2. DATABASE_SCHEMA.md        — all 6 tables, indexes, JSON shapes for every type
3. FEATURES.md               — every page, every interaction, every rule
4. UI_UX.md                  — layout, colors, components, print CSS
5. NON_FUNCTIONAL.md         — performance, backup, deployment, code quality rules
6. TEST_TEMPLATES_SEED.json  — the actual seed data for all lab tests (30+ templates)
7. IMPLEMENTATION_PLAN.md    — phase-by-phase build order with test checklists

Do not skip any document. Do not rely on memory or assumptions.

## TECH STACK (non-negotiable)
- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: PostgreSQL (NOT SQLite)
- Print/PDF: window.print() + CSS @media print (NO PDF libraries)

## BUILD ORDER
Follow IMPLEMENTATION_PLAN.md exactly:
- Phase 1: Scaffold + Database
- Phase 2: Patients & Doctors
- Phase 3: Test Templates + Settings
- Phase 4: Create Report (core feature)
- Phase 5: View Report + Print + Reports List
- Phase 6: Dashboard + Edit Report
- Phase 7: Backup Script + README

Complete each phase and verify its test checklist before starting the next.

## ABSOLUTE RULES
1. Parameterized queries only — never concatenate user input into SQL
2. All JSON columns use JSONB in PostgreSQL
3. One pg Pool exported from server/db/index.js — imported everywhere, never recreated
4. All frontend API calls go in client/src/api/ — never write fetch() directly in components
5. Try/catch on every async function
6. Debounce all search inputs at 300ms
7. Dates stored as ISO (YYYY-MM-DD), displayed as DD/MM/YYYY everywhere
8. Print view: zero UI chrome — sidebar and buttons hidden via @media print
9. Final reports cannot be edited — enforce on both frontend and backend
10. Do not add any feature not in the spec

## PROJECT STRUCTURE
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
│   │   ├── index.js      ← pg Pool export
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── index.js
│   └── package.json
├── backup/
│   └── backup.js
├── backups/              ← gitignored, created at runtime
└── README.md
```

## KEY DESIGN DECISIONS ALREADY MADE
- Report sections are NOT a separate table — tests group by their category field automatically
- result_data stored as JSONB — shape depends on report_type (standard/qualitative/descriptive/hormones)
- lab_no is VARCHAR, auto-incremented from MAX+1 but user-editable
- "Self" doctor (id=1) is seeded for walk-in patients — doctor is never NULL
- Age stored as VARCHAR ("35 Years", "6 Months") not integer
- No authentication, no billing, no file uploads — explicitly out of scope
- Cross Match and Widal Test are deferred — do not build them

## IF SOMETHING IS UNCLEAR
Check FEATURES.md first. If still unclear, make the simplest reasonable choice and add a TODO comment.
Do not invent features. Do not expand scope.

Start with Phase 1.
