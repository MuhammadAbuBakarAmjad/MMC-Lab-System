# Non-Functional Requirements

## Performance

### Database
- Use PostgreSQL — not SQLite. Write locking on SQLite is unacceptable for production.
- All search queries must use indexed columns only. No full table scans on large tables.
- Required indexes are defined in DATABASE_SCHEMA.md — create all of them.
- Use JSONB (not JSON) for all JSON columns — PostgreSQL indexes JSONB.
- Connection pooling: use `pg` package with a pool of 10 connections.

### API Response Times (targets)
- Patient/doctor search: < 100ms
- Load report list (paginated): < 200ms
- Load single report (view): < 150ms
- Save new report: < 300ms
- Dashboard stats: < 500ms (aggregates, acceptable to be slightly slower)

### Frontend
- Use Vite for bundling — not Create React App. Vite is significantly faster.
- Lazy load page components using React.lazy() and Suspense
- Debounce all search inputs at 300ms — never fire API on every keystroke
- Paginate reports list at 20 rows per page — never load all reports at once

---

## Backup

### Automated Daily Backup
The system must include a backup script that runs automatically every night.

**Script: `backup/backup.js`**
```javascript
// Runs via node backup/backup.js
// Called nightly by Windows Task Scheduler
// 1. Runs pg_dump to create a .sql file
// 2. Saves to ./backups/backup_YYYY-MM-DD.sql
// 3. Deletes backups older than 30 days
// 4. Copies latest backup to a configured Google Drive folder path (if set)
```

**Backup file location:** `./backups/` directory next to the server

**Retention:** Keep last 30 days only. Delete older files automatically in the same script.

**Google Drive sync:** The Google Drive desktop app syncs a local folder to the cloud automatically. The backup script saves to that synced folder. No API calls needed — just save to the right path. Document which path to configure in the README.

**Task Scheduler setup:** Document in README how to set up Windows Task Scheduler to run `node backup/backup.js` nightly at 2:00 AM.

### Backup File Naming
```
backup_2026-06-08.sql
backup_2026-06-07.sql
...
```

### What a Backup Contains
A full pg_dump — all tables, all data, all indexes. Restoring from it gives a complete working database.

### Restore Instructions
Document clearly in README:
```
To restore from backup:
1. psql -U postgres -c "DROP DATABASE labsystem;"
2. psql -U postgres -c "CREATE DATABASE labsystem;"
3. psql -U postgres labsystem < backups/backup_2026-06-08.sql
```

---

## Storage

### Database Storage
- Text data only — no files, no images stored in database
- Estimated growth: ~3.5KB per report × 18,000 reports/year = ~63MB/year
- After 10 years: < 1GB — storage is not a concern
- Backup files: ~200MB for 30 days of backups — not a concern

### File Storage
- Do not store any files in the database
- If file storage is ever needed in the future, store files on disk and save the path in the database
- This is out of scope for now

---

## Deployment

### Target Environment
- Windows PC or mini server at the hospital
- Local area network only — no internet required for operation
- Staff access via browser: `http://[server-ip]:3000`

### Server Setup Requirements
- Node.js 20+
- PostgreSQL 15+
- No Docker required — keep it simple for a non-technical client

### Project Structure
```
lab-system/
├── client/          ← React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── api/     ← all API call functions
│   │   └── utils/
│   └── package.json
├── server/          ← Express backend
│   ├── routes/
│   ├── db/
│   │   ├── schema.sql
│   │   └── seed.sql
│   └── package.json
├── backup/
│   └── backup.js
├── backups/         ← created at runtime, gitignored
└── README.md
```

### Environment Variables (server/.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=labsystem
DB_USER=postgres
DB_PASSWORD=yourpassword
PORT=3000
BACKUP_PATH=./backups
GOOGLE_DRIVE_BACKUP_PATH=   ← optional, path to Google Drive synced folder
```

### README Must Include
1. Prerequisites (Node.js, PostgreSQL versions)
2. Installation steps (clone, npm install, create DB, run migrations, seed)
3. How to start the server
4. How to access from other computers on the network
5. How to set up nightly backup with Windows Task Scheduler
6. How to restore from backup
7. How to add new test templates from Settings

---

## Security (minimal — local network only)
- No authentication required for now (single user, local network)
- Sanitize all database inputs — use parameterized queries only, never string concatenation in SQL
- No patient data leaves the local network
- Validate all inputs server-side — do not trust frontend validation alone

---

## Error Handling
- All API endpoints must return consistent error responses:
  ```json
  { "error": "Human readable message", "code": "MACHINE_READABLE_CODE" }
  ```
- Never expose stack traces or internal errors to the frontend
- All database errors must be caught and logged to server console
- Frontend must handle: 400 (validation), 404 (not found), 500 (server error) gracefully

---

## Code Quality Rules for the Agent
1. Use parameterized queries for ALL database operations — no string concatenation in SQL ever
2. All async functions must have try/catch
3. Separate concerns: routes handle HTTP, db/ modules handle queries — no SQL in route files
4. Use a single db.js module that exports the pg pool — import it everywhere, don't create new connections
5. Frontend API calls go in src/api/ directory — never write fetch() directly in components
6. Keep components small — if a component is over 150 lines, split it
