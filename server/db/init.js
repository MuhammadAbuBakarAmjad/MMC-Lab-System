// Database initializer — drops and recreates all tables, then seeds data
// Usage: node server/db/init.js
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

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
  console.log(`  ✓ Ran ${path.basename(filePath)}`);
}

async function initDatabase() {
  console.log('Initializing database...');
  console.log(`  Connecting to: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);

  try {
    await runSqlFile(path.join(__dirname, 'schema.sql'));
    await runSqlFile(path.join(__dirname, 'seed.sql'));

    // Verify the seed counts are correct
    const settingsCount  = await pool.query('SELECT COUNT(*) FROM lab_settings');
    const doctorsCount   = await pool.query('SELECT COUNT(*) FROM doctors');
    const templatesCount = await pool.query('SELECT COUNT(*) FROM test_templates');

    console.log('\nVerification:');
    console.log(`  lab_settings rows: ${settingsCount.rows[0].count} (expected 1)`);
    console.log(`  doctors rows:      ${doctorsCount.rows[0].count} (expected 1 — "Self")`);
    console.log(`  test_templates:    ${templatesCount.rows[0].count} (expected 41)`);

    console.log('\nDatabase initialized successfully.');
  } catch (error) {
    console.error('\nDatabase initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
