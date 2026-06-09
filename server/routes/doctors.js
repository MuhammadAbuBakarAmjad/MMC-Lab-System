// Doctors API routes — handles all /api/doctors endpoints
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Search doctors by name or phone
// "Self" doctor always appears first in results
router.get('/search', async (req, res) => {
  const query = req.query.q || '';

  try {
    const result = await db.query(
      `SELECT id, name, phone
       FROM doctors
       WHERE name ILIKE $1
          OR phone LIKE $1
       ORDER BY
         CASE WHEN id = 1 THEN 0 ELSE 1 END,
         name
       LIMIT 10`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to search doctors:', error);
    res.status(500).json({ error: 'Could not search doctors', code: 'SEARCH_FAILED' });
  }
});

// List all doctors — used to populate filter dropdowns
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, phone
       FROM doctors
       ORDER BY
         CASE WHEN id = 1 THEN 0 ELSE 1 END,
         name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to list doctors:', error);
    res.status(500).json({ error: 'Could not load doctors', code: 'LOAD_FAILED' });
  }
});

// Create a new doctor
router.post('/', async (req, res) => {
  const { name, phone } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Doctor name is required', code: 'NAME_REQUIRED' });
  }

  try {
    const result = await db.query(
      `INSERT INTO doctors (name, phone)
       VALUES ($1, $2)
       RETURNING id, name, phone, created_at`,
      [name.trim(), phone ? phone.trim() : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create doctor:', error);
    res.status(500).json({ error: 'Could not create doctor', code: 'CREATE_FAILED' });
  }
});

module.exports = router;
