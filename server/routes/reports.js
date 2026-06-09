// Reports API routes — handles /api/reports endpoints
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Returns the next available lab number (highest existing numeric lab_no + 1)
// Ignores non-numeric lab_nos when calculating the max
router.get('/next-lab-no', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT COALESCE(MAX(CAST(lab_no AS INTEGER)), 0) + 1 AS next_lab_no
       FROM reports
       WHERE lab_no ~ '^[0-9]+$'`
    );
    res.json({ lab_no: result.rows[0].next_lab_no.toString() });
  } catch (error) {
    console.error('Failed to get next lab number:', error);
    res.status(500).json({ error: 'Could not get next lab number', code: 'QUERY_FAILED' });
  }
});

// Create a new report with all its test results in a single transaction
// Body: { lab_no, patient_id, doctor_id, report_date, status, results: [...] }
router.post('/', async (req, res) => {
  const { lab_no, patient_id, doctor_id, report_date, status, results } = req.body;

  // Validate required fields before touching the database
  if (!lab_no || lab_no.toString().trim() === '') {
    return res.status(400).json({ error: 'Lab number is required', code: 'LAB_NO_REQUIRED' });
  }
  if (!patient_id) {
    return res.status(400).json({ error: 'Patient is required', code: 'PATIENT_REQUIRED' });
  }
  if (!results || results.length === 0) {
    return res.status(400).json({ error: 'At least one test must be selected', code: 'RESULTS_REQUIRED' });
  }

  // Confirm the patient actually exists before creating the report
  try {
    const patientCheck = await db.query('SELECT id FROM patients WHERE id = $1', [patient_id]);
    if (patientCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Patient not found', code: 'PATIENT_NOT_FOUND' });
    }
  } catch (error) {
    console.error('Failed to validate patient:', error);
    return res.status(500).json({ error: 'Could not validate patient', code: 'VALIDATION_FAILED' });
  }

  // Use a transaction so report + all results are inserted atomically
  // If any result insert fails, the whole report is rolled back
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const reportResult = await client.query(
      `INSERT INTO reports (lab_no, patient_id, doctor_id, report_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, lab_no, patient_id, doctor_id, report_date, status, created_at`,
      [
        lab_no.toString().trim(),
        patient_id,
        doctor_id || null,
        report_date || new Date().toISOString().split('T')[0],
        status || 'draft',
      ]
    );

    const report = reportResult.rows[0];

    for (const result of results) {
      await client.query(
        `INSERT INTO report_results (report_id, template_id, result_data, display_order)
         VALUES ($1, $2, $3, $4)`,
        [
          report.id,
          result.template_id,
          JSON.stringify(result.result_data),
          result.display_order || 0,
        ]
      );
    }

    await client.query('COMMIT');
    res.status(201).json(report);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to create report:', error);

    // PostgreSQL unique constraint violation — lab_no already exists
    if (error.code === '23505') {
      return res.status(400).json({
        error: `Lab number "${lab_no}" is already in use. Please use a different number.`,
        code:  'LAB_NO_DUPLICATE',
      });
    }

    res.status(500).json({ error: 'Could not create report', code: 'CREATE_FAILED' });
  } finally {
    client.release();
  }
});

module.exports = router;
