# Project Overview — Mashallah Medical Complex Lab System

## Client
**Mashallah Medical Complex, Multan, Pakistan**
Department of Pathology

## What This Is
A web-based laboratory report management system to replace the client's current workflow of manually filling Excel spreadsheet templates and printing them. The system must replicate everything they currently do in Excel — just faster, stored properly, searchable, and printable with one click.

## What The Client Currently Does
- They have one Excel workbook with one sheet per report type (CBC, LFT, RPM, Urine RE, etc.)
- For each patient, they open the relevant sheet, type patient name/age/date/lab number and doctor name at the top, fill in result values, and print
- There is no patient history, no search, no analytics beyond what they manually count
- Lab numbers are assigned sequentially by hand

## Scope — What Is IN This System
- Patient records (create, search, view history)
- Doctor records (create, search)
- Test templates (pre-seeded from their Excel, manageable from settings)
- Lab reports (create, fill results, save, view, print/PDF)
- Basic dashboard analytics (reports today, total patients, top referring doctors)
- Lab settings (name, address, department — editable)
- Automated daily database backup to a local file

## Scope — What Is EXPLICITLY OUT (Do Not Build)
- Billing and payments
- Patient login or patient-facing portal
- Cross Match test (deferred — too complex for now)
- Widal Test (deferred — unique dilution table format)
- File/image attachments
- Multi-branch or multi-lab support
- User authentication / roles (single user system for now)
- SMS or WhatsApp delivery
- External API integrations

## Deployment Target
- **Local server only** — runs on a single PC or mini server at the hospital
- Staff access via browser on the local network (e.g. http://192.168.1.x:3000)
- No internet connection required for operation
- No cloud hosting — all data stays on-premise

## Tech Stack
| Layer | Choice | Reason |
|---|---|---|
| Frontend | React + Vite | Fast builds, component-based, familiar ecosystem |
| Styling | Tailwind CSS | Utility-first, responsive, no custom CSS mess |
| Backend | Node.js + Express | Lightweight, easy to run locally |
| Database | PostgreSQL | Handles concurrent access, proper indexing, scales to millions of rows, industry standard |
| PDF/Print | Browser native (window.print()) | No library needed, staff just Ctrl+P or Save as PDF |
| Backup | pg_dump via Windows Task Scheduler | Automated nightly, copies to Google Drive folder |

## Why PostgreSQL and Not SQLite
SQLite has write locking — only one write at a time. While this is a single-user system now, it is not future-proof. PostgreSQL setup takes one hour and scales indefinitely. Migration from SQLite later would take weeks. Use PostgreSQL from day one.

## Language & Locale Notes
- Date format used by client: DD/MM/YYYY
- All UI text in English
- The system is for lab technician use — keep UI simple, minimal clicks, nothing fancy
