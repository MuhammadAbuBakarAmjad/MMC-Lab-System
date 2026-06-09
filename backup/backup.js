// Backup script — runs via: node backup/backup.js
// Set up with Windows Task Scheduler to run nightly at 2:00 AM
// See README.md for setup instructions
const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const BACKUP_DIR   = path.resolve(process.env.BACKUP_PATH || './backups');
const DRIVE_PATH   = process.env.GOOGLE_DRIVE_BACKUP_PATH || '';
const TODAY        = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const BACKUP_FILE  = path.join(BACKUP_DIR, `backup_${TODAY}.sql`);
const PG_DUMP_PATH = 'pg_dump'; // Ensure PostgreSQL bin is in PATH, or use full path

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    log(`Created backup directory: ${BACKUP_DIR}`);
  }
}

function runDump() {
  log(`Starting database backup → ${BACKUP_FILE}`);

  const env = {
    ...process.env,
    PGPASSWORD: process.env.DB_PASSWORD,
  };

  const command = `"${PG_DUMP_PATH}" -U ${process.env.DB_USER} -h ${process.env.DB_HOST} -p ${process.env.DB_PORT} ${process.env.DB_NAME}`;

  const output = execSync(command, { env });
  fs.writeFileSync(BACKUP_FILE, output);
  log(`Backup written: ${BACKUP_FILE} (${Math.round(output.length / 1024)}KB)`);
}

function deleteOldBackups() {
  // Keep backups for the last 30 days, delete older ones
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup_') && f.endsWith('.sql'));

  for (const file of files) {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    if (stats.mtimeMs < thirtyDaysAgo) {
      fs.unlinkSync(filePath);
      log(`Deleted old backup: ${file}`);
    }
  }
}

function copyToGoogleDrive() {
  // Google Drive desktop app syncs this folder automatically — just copy the file there
  if (!DRIVE_PATH) return;

  if (!fs.existsSync(DRIVE_PATH)) {
    log(`Google Drive path not found, skipping: ${DRIVE_PATH}`);
    return;
  }

  const destination = path.join(DRIVE_PATH, `backup_${TODAY}.sql`);
  fs.copyFileSync(BACKUP_FILE, destination);
  log(`Copied to Google Drive: ${destination}`);
}

async function runBackup() {
  try {
    ensureBackupDir();
    runDump();
    deleteOldBackups();
    copyToGoogleDrive();
    log('Backup completed successfully.');
  } catch (error) {
    log(`Backup failed: ${error.message}`);
    process.exit(1);
  }
}

runBackup();
