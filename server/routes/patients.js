// Patients API routes — handles all /api/patients endpoints
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Search patients — search_by controls which field to match:
// 'name' | 'phone' | 'id' | 'cnic' | 'father'
// Default is 'name'. Used by PatientSearch component and the Patients list page.
router.get('/search', async (req, res) => {
  const query    = req.query.q          || '';
  const searchBy = req.query.search_by  || 'name';

  if (query.trim().length === 0) {
    return res.json([]);
  }

  // Build the WHERE clause based on the selected search field
  let whereClause;
  let params;
  if (searchBy === 'phone') {
    whereClause = 'p.phone LIKE $1';
    params      = [`%${query}%`];
  } else if (searchBy === 'id') {
    whereClause = 'p.id::text = $1';
    params      = [query];
  } else if (searchBy === 'cnic') {
    whereClause = 'p.cnic ILIKE $1';
    params      = [`%${query}%`];
  } else if (searchBy === 'father') {
    whereClause = 'p.father_husband_name ILIKE $1';
    params      = [`%${query}%`];
  } else {
    // Default: name
    whereClause = 'p.name ILIKE $1';
    params      = [`%${query}%`];
  }

  try {
    const result = await db.query(
      `SELECT
         p.id,
         p.name,
         p.age,
         p.gender,
         p.phone,
         p.father_husband_name,
         p.cnic,
         COUNT(r.id) AS report_count
       FROM patients p
       LEFT JOIN reports r ON r.patient_id = p.id
       WHERE ${whereClause}
       GROUP BY p.id
       ORDER BY p.name
       LIMIT 10`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to search patients:', error);
    res.status(500).json({ error: 'Could not search patients', code: 'SEARCH_FAILED' });
  }
});

// Get a single patient by id
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT id, name, age, gender, phone, father_husband_name, cnic, created_at
       FROM patients WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found', code: 'NOT_FOUND' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to get patient:', error);
    res.status(500).json({ error: 'Could not load patient', code: 'LOAD_FAILED' });
  }
});

// Get all reports for a patient
// Returns summary info — not full result data
router.get('/:id/reports', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query(
      `SELECT
         r.id,
         r.lab_no,
         r.report_date,
         r.status,
         d.name AS doctor_name,
         ARRAY_AGG(tt.test_name ORDER BY rr.display_order) AS test_names
       FROM reports r
       LEFT JOIN doctors d ON d.id = r.doctor_id
       LEFT JOIN report_results rr ON rr.report_id = r.id
       LEFT JOIN test_templates tt ON tt.id = rr.template_id
       WHERE r.patient_id = $1
       GROUP BY r.id, d.name
       ORDER BY r.report_date DESC, r.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to get patient reports:', error);
    res.status(500).json({ error: 'Could not load patient reports', code: 'LOAD_FAILED' });
  }
});

// Create a new patient
router.post('/', async (req, res) => {
  const { name, age, gender, phone, father_husband_name, cnic } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Patient name is required', code: 'NAME_REQUIRED' });
  }
  if (!phone || phone.trim().length === 0) {
    return res.status(400).json({ error: 'Patient phone is required', code: 'PHONE_REQUIRED' });
  }

  try {
    const result = await db.query(
      `INSERT INTO patients (name, age, gender, phone, father_husband_name, cnic)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, age, gender, phone, father_husband_name, cnic, created_at`,
      [
        name.trim(),
        age    || null,
        gender || null,
        phone.trim(),
        father_husband_name ? father_husband_name.trim() : null,
        cnic                ? cnic.trim()                : null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create patient:', error);
    res.status(500).json({ error: 'Could not create patient', code: 'CREATE_FAILED' });
  }
});

// Update an existing patient
router.put('/:id', async (req, res) => {
  const { id }                                          = req.params;
  const { name, age, gender, phone, father_husband_name, cnic } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Patient name is required', code: 'NAME_REQUIRED' });
  }
  if (!phone || phone.trim().length === 0) {
    return res.status(400).json({ error: 'Patient phone is required', code: 'PHONE_REQUIRED' });
  }

  try {
    const result = await db.query(
      `UPDATE patients
       SET name = $1, age = $2, gender = $3, phone = $4,
           father_husband_name = $5, cnic = $6
       WHERE id = $7
       RETURNING id, name, age, gender, phone, father_husband_name, cnic, created_at`,
      [
        name.trim(),
        age    || null,
        gender || null,
        phone.trim(),
        father_husband_name ? father_husband_name.trim() : null,
        cnic                ? cnic.trim()                : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found', code: 'NOT_FOUND' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update patient:', error);
    res.status(500).json({ error: 'Could not update patient', code: 'UPDATE_FAILED' });
  }
});

module.exports = router;
