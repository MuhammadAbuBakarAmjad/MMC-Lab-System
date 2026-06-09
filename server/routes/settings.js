// Settings API routes — handles /api/settings
// The lab_settings table always has exactly one row (id = 1)
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Return the single lab settings row
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, lab_name, address, department, footer_note FROM lab_settings WHERE id = 1'
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab settings not found', code: 'NOT_FOUND' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to load settings:', error);
    res.status(500).json({ error: 'Could not load settings', code: 'LOAD_FAILED' });
  }
});

// Update the single lab settings row
// Always updates id = 1 — there is no other row
router.put('/', async (req, res) => {
  const { lab_name, address, department, footer_note } = req.body;

  if (!lab_name || lab_name.trim().length === 0) {
    return res.status(400).json({ error: 'Lab name is required', code: 'NAME_REQUIRED' });
  }

  try {
    const result = await db.query(
      `UPDATE lab_settings
       SET lab_name    = $1,
           address     = $2,
           department  = $3,
           footer_note = $4
       WHERE id = 1
       RETURNING id, lab_name, address, department, footer_note`,
      [
        lab_name.trim(),
        address     || null,
        department  || null,
        footer_note || null,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lab settings not found', code: 'NOT_FOUND' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update settings:', error);
    res.status(500).json({ error: 'Could not update settings', code: 'UPDATE_FAILED' });
  }
});

module.exports = router;
