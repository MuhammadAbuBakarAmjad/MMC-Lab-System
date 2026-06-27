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

// Paginated list of reports with optional filters
// Query params: page, limit, q (search), search_by, from, to, doctor_id, status
router.get('/', async (req, res) => {
  const page      = Math.max(1, parseInt(req.query.page)  || 1);
  const limit     = Math.max(1, parseInt(req.query.limit) || 20);
  const offset    = (page - 1) * limit;
  const search    = req.query.q         || '';
  const searchBy  = req.query.search_by || 'name'; // 'name' | 'phone' | 'lab_no' | 'cnic' | 'father'
  const fromDate  = req.query.from      || '';
  const toDate    = req.query.to        || '';
  const doctorId  = req.query.doctor_id || '';
  const status    = req.query.status    || '';

  // Build the WHERE clauses dynamically based on which filters are active
  const conditions = [];
  const params     = [];

  if (search) {
    params.push(`%${search}%`);
    const idx = params.length;
    // Restrict search to the selected field — avoids cross-field noise
    if (searchBy === 'lab_no') {
      conditions.push(`r.lab_no ILIKE $${idx}`);
    } else if (searchBy === 'phone') {
      conditions.push(`p.phone ILIKE $${idx}`);
    } else if (searchBy === 'cnic') {
      conditions.push(`p.cnic ILIKE $${idx}`);
    } else if (searchBy === 'father') {
      conditions.push(`p.father_husband_name ILIKE $${idx}`);
    } else {
      // Default: patient name
      conditions.push(`p.name ILIKE $${idx}`);
    }
  }

  if (fromDate) {
    params.push(fromDate);
    conditions.push(`r.report_date >= $${params.length}`);
  }

  if (toDate) {
    params.push(toDate);
    conditions.push(`r.report_date <= $${params.length}`);
  }

  if (doctorId) {
    params.push(doctorId);
    conditions.push(`r.doctor_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    conditions.push(`r.status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    // Count total matching rows for pagination metadata
    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM reports r
       JOIN patients p ON p.id = r.patient_id
       ${whereClause}`,
      params
    );

    const total      = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Fetch the page of results with patient and doctor names joined in
    const listParams = [...params, limit, offset];
    const listResult = await db.query(
      `SELECT
         r.id,
         r.lab_no,
         r.report_date,
         r.status,
         r.specimen,
         r.created_at,
         p.id   AS patient_id,
         p.name AS patient_name,
         p.age  AS patient_age,
         p.gender AS patient_gender,
         p.phone AS patient_phone,
         d.id   AS doctor_id,
         d.name AS doctor_name
       FROM reports r
       JOIN patients p ON p.id = r.patient_id
       LEFT JOIN doctors d ON d.id = r.doctor_id
       ${whereClause}
       ORDER BY r.report_date DESC, r.id DESC
       LIMIT $${listParams.length - 1} OFFSET $${listParams.length}`,
      listParams
    );

    res.json({
      reports:     listResult.rows,
      total,
      page,
      totalPages,
      limit,
    });
  } catch (error) {
    console.error('Failed to list reports:', error);
    res.status(500).json({ error: 'Could not load reports', code: 'QUERY_FAILED' });
  }
});

// Get a single report with patient, doctor, and all results joined
// Used by the View Report and Edit Report pages
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Load the report row with patient and doctor info
    const reportResult = await db.query(
      `SELECT
         r.id,
         r.lab_no,
         r.report_date,
         r.status,
         r.specimen,
         r.finalized_at,
         r.created_at,
         p.id                  AS patient_id,
         p.name                AS patient_name,
         p.age                 AS patient_age,
         p.gender              AS patient_gender,
         p.phone               AS patient_phone,
         p.father_husband_name AS patient_father_husband_name,
         p.cnic                AS patient_cnic,
         d.id     AS doctor_id,
         d.name   AS doctor_name
       FROM reports r
       JOIN patients p ON p.id = r.patient_id
       LEFT JOIN doctors d ON d.id = r.doctor_id
       WHERE r.id = $1`,
      [id]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    const row = reportResult.rows[0];

    // Load all test results for this report, joined with their template metadata
    const resultsResult = await db.query(
      `SELECT
         rr.id,
         rr.template_id,
         rr.result_data,
         rr.display_order,
         tt.test_name,
         tt.category,
         tt.report_type
       FROM report_results rr
       JOIN test_templates tt ON tt.id = rr.template_id
       WHERE rr.report_id = $1
       ORDER BY rr.display_order ASC`,
      [id]
    );

    // Shape the response to match the spec
    const report = {
      id:           row.id,
      lab_no:       row.lab_no,
      report_date:  row.report_date,
      status:       row.status,
      specimen:     row.specimen,
      finalized_at: row.finalized_at,
      created_at:   row.created_at,
      patient: {
        id:                  row.patient_id,
        name:                row.patient_name,
        age:                 row.patient_age,
        gender:              row.patient_gender,
        phone:               row.patient_phone,
        father_husband_name: row.patient_father_husband_name,
        cnic:                row.patient_cnic,
      },
      doctor: {
        id:   row.doctor_id,
        name: row.doctor_name,
      },
      results: resultsResult.rows,
    };

    res.json(report);
  } catch (error) {
    console.error('Failed to load report:', error);
    res.status(500).json({ error: 'Could not load report', code: 'QUERY_FAILED' });
  }
});

// Delete a report (and its results via CASCADE)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      'DELETE FROM reports WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, id: parseInt(id) });
  } catch (error) {
    console.error('Failed to delete report:', error);
    res.status(500).json({ error: 'Could not delete report', code: 'DELETE_FAILED' });
  }
});

// Create a new report with all its test results in a single transaction
// Body: { lab_no, patient_id, doctor_id, report_date, status, specimen, results: [...] }
router.post('/', async (req, res) => {
  const { lab_no, patient_id, doctor_id, report_date, status, specimen, results } = req.body;

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

  // Set finalized_at to now when the report is being created as final
  const isFinal      = (status === 'final');
  const finalizedAt  = isFinal ? new Date() : null;

  // Use a transaction so report + all results are inserted atomically
  // If any result insert fails, the whole report is rolled back
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const reportResult = await client.query(
      `INSERT INTO reports (lab_no, patient_id, doctor_id, report_date, status, specimen, finalized_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, lab_no, patient_id, doctor_id, report_date, status, specimen, finalized_at, created_at`,
      [
        lab_no.toString().trim(),
        patient_id,
        doctor_id    || null,
        report_date  || new Date().toISOString().split('T')[0],
        status       || 'draft',
        specimen     || null,
        finalizedAt,
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

    // Unique constraint violation on lab_no
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Lab number already exists', code: 'LAB_NO_DUPLICATE' });
    }

    res.status(500).json({ error: 'Could not create report', code: 'CREATE_FAILED' });
  } finally {
    client.release();
  }
});

// Update an existing draft report — replaces results atomically
// Returns 403 if the report has already been finalized
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { lab_no, patient_id, doctor_id, report_date, status, specimen, results } = req.body;

  // Validate required fields
  if (!patient_id) {
    return res.status(400).json({ error: 'Patient is required', code: 'PATIENT_REQUIRED' });
  }
  if (!results || results.length === 0) {
    return res.status(400).json({ error: 'At least one test must be selected', code: 'RESULTS_REQUIRED' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Check the report exists and is still a draft — final reports cannot be edited
    const existing = await client.query(
      'SELECT id, status FROM reports WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Report not found', code: 'NOT_FOUND' });
    }

    if (existing.rows[0].status === 'final') {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Final reports cannot be edited', code: 'REPORT_FINALIZED' });
    }

    // Set finalized_at when transitioning to final for the first time
    const isFinal     = (status === 'final');
    const finalizedAt = isFinal ? new Date() : null;

    // Update the report header row
    await client.query(
      `UPDATE reports
       SET lab_no = $1, patient_id = $2, doctor_id = $3, report_date = $4,
           status = $5, specimen = $6, finalized_at = $7
       WHERE id = $8`,
      [
        lab_no.toString().trim(),
        patient_id,
        doctor_id   || null,
        report_date || new Date().toISOString().split('T')[0],
        status      || 'draft',
        specimen    || null,
        finalizedAt,
        id,
      ]
    );

    // Replace all results: delete the old ones and insert the new set
    await client.query('DELETE FROM report_results WHERE report_id = $1', [id]);

    for (const result of results) {
      await client.query(
        `INSERT INTO report_results (report_id, template_id, result_data, display_order)
         VALUES ($1, $2, $3, $4)`,
        [
          id,
          result.template_id,
          JSON.stringify(result.result_data),
          result.display_order || 0,
        ]
      );
    }

    await client.query('COMMIT');
    res.json({ id: parseInt(id), status: status || 'draft' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to update report:', error);

    // Unique constraint violation on lab_no
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Lab number already exists', code: 'LAB_NO_DUPLICATE' });
    }

    res.status(500).json({ error: 'Could not update report', code: 'UPDATE_FAILED' });
  } finally {
    client.release();
  }
});

module.exports = router;
