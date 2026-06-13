// Dashboard API routes — summary stats and activity feeds
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Returns counts for the 4 stat cards on the dashboard
router.get('/stats', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE report_date = CURRENT_DATE)                  AS reports_today,
        COUNT(*) FILTER (WHERE DATE_TRUNC('month', report_date) = DATE_TRUNC('month', CURRENT_DATE)) AS reports_this_month,
        (SELECT COUNT(*) FROM patients)                                      AS total_patients,
        (SELECT COUNT(*) FROM doctors)                                       AS total_doctors
      FROM reports
    `);

    const row = result.rows[0];
    res.json({
      reports_today:       parseInt(row.reports_today),
      reports_this_month:  parseInt(row.reports_this_month),
      total_patients:      parseInt(row.total_patients),
      total_doctors:       parseInt(row.total_doctors),
    });
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
    res.status(500).json({ error: 'Could not load dashboard stats', code: 'QUERY_FAILED' });
  }
});

// Returns the 10 most recently created reports with patient and doctor info
router.get('/recent', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        r.id,
        r.lab_no,
        r.report_date,
        r.status,
        p.id     AS patient_id,
        p.name   AS patient_name,
        p.age    AS patient_age,
        p.gender AS patient_gender,
        d.name   AS doctor_name
      FROM reports r
      JOIN patients p ON p.id = r.patient_id
      LEFT JOIN doctors d ON d.id = r.doctor_id
      ORDER BY r.created_at DESC, r.id DESC
      LIMIT 10
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Failed to load recent reports:', error);
    res.status(500).json({ error: 'Could not load recent reports', code: 'QUERY_FAILED' });
  }
});

// Returns the top 5 referring doctors by report count in the current calendar month
router.get('/top-doctors', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        d.id,
        d.name,
        COUNT(r.id) AS report_count
      FROM reports r
      JOIN doctors d ON d.id = r.doctor_id
      WHERE DATE_TRUNC('month', r.report_date) = DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY d.id, d.name
      ORDER BY report_count DESC
      LIMIT 5
    `);

    res.json(result.rows.map((row) => ({
      id:           row.id,
      name:         row.name,
      report_count: parseInt(row.report_count),
    })));
  } catch (error) {
    console.error('Failed to load top doctors:', error);
    res.status(500).json({ error: 'Could not load top doctors', code: 'QUERY_FAILED' });
  }
});

module.exports = router;
