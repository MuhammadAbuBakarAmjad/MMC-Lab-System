// Applies migrate_001.sql to an existing database.
// Run via: node server/db/migrate_001.js
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function runMigration() {
  console.log('Running migration 001...');
  console.log(`  Connecting to: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);

  const sql = fs.readFileSync(path.join(__dirname, 'migrate_001.sql'), 'utf8');

  try {
    await pool.query(sql);
    console.log('  ✓ Migration applied successfully.');
    console.log('\nNew columns added:');
    console.log('  patients.father_husband_name  VARCHAR(255)');
    console.log('  patients.cnic                 VARCHAR(20) + index');
    console.log('  reports.specimen              TEXT');
    console.log('  reports.finalized_at          TIMESTAMP');
    console.log('  lab_settings.contact_no       VARCHAR(50)');
  } catch (error) {
    console.error('\nMigration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
