// Test templates API routes — handles all /api/templates endpoints
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Return all active templates grouped by category
// Used by the New Report page to build the test picker accordion
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, test_name, category, report_type, template_data, display_order
       FROM test_templates
       WHERE is_active = true
       ORDER BY category, display_order, test_name`
    );

    const grouped = groupTemplatesByCategory(result.rows);
    res.json(grouped);
  } catch (error) {
    console.error('Failed to load active templates:', error);
    res.status(500).json({ error: 'Could not load templates', code: 'LOAD_FAILED' });
  }
});

// Return all templates including inactive — used by Settings page
router.get('/all', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, test_name, category, report_type, template_data, display_order, is_active
       FROM test_templates
       ORDER BY category, display_order, test_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Failed to load all templates:', error);
    res.status(500).json({ error: 'Could not load templates', code: 'LOAD_FAILED' });
  }
});

// Create a new test template
router.post('/', async (req, res) => {
  const { test_name, category, report_type, template_data, display_order } = req.body;

  if (!test_name || test_name.trim().length === 0) {
    return res.status(400).json({ error: 'Test name is required', code: 'NAME_REQUIRED' });
  }
  if (!category || category.trim().length === 0) {
    return res.status(400).json({ error: 'Category is required', code: 'CATEGORY_REQUIRED' });
  }

  const validReportTypes = ['standard', 'qualitative', 'descriptive', 'hormones'];
  if (!report_type || !validReportTypes.includes(report_type)) {
    return res.status(400).json({
      error: 'Report type must be one of: standard, qualitative, descriptive, hormones',
      code: 'INVALID_REPORT_TYPE',
    });
  }

  if (!template_data) {
    return res.status(400).json({ error: 'Template data is required', code: 'TEMPLATE_DATA_REQUIRED' });
  }

  // Validate that template_data is valid JSON (it arrives as a string from the textarea)
  let parsedTemplateData;
  try {
    parsedTemplateData = typeof template_data === 'string'
      ? JSON.parse(template_data)
      : template_data;
  } catch {
    return res.status(400).json({ error: 'Template data is not valid JSON', code: 'INVALID_JSON' });
  }

  try {
    const result = await db.query(
      `INSERT INTO test_templates (test_name, category, report_type, template_data, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, test_name, category, report_type, template_data, display_order, is_active`,
      [
        test_name.trim(),
        category.trim().toUpperCase(),
        report_type,
        JSON.stringify(parsedTemplateData),
        display_order || 0,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Failed to create template:', error);
    res.status(500).json({ error: 'Could not create template', code: 'CREATE_FAILED' });
  }
});

// Update a template — name, category, is_active, template_data
// Called when toggling active/inactive from the Settings page
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { test_name, category, report_type, template_data, display_order, is_active } = req.body;

  if (test_name !== undefined && test_name.trim().length === 0) {
    return res.status(400).json({ error: 'Test name cannot be empty', code: 'NAME_REQUIRED' });
  }

  // Validate report_type only if it's being changed
  const validReportTypes = ['standard', 'qualitative', 'descriptive', 'hormones'];
  if (report_type !== undefined && !validReportTypes.includes(report_type)) {
    return res.status(400).json({
      error: 'Report type must be one of: standard, qualitative, descriptive, hormones',
      code: 'INVALID_REPORT_TYPE',
    });
  }

  // Validate template_data JSON if provided
  let parsedTemplateData;
  if (template_data !== undefined) {
    try {
      parsedTemplateData = typeof template_data === 'string'
        ? JSON.parse(template_data)
        : template_data;
    } catch {
      return res.status(400).json({ error: 'Template data is not valid JSON', code: 'INVALID_JSON' });
    }
  }

  try {
    // Fetch the current template so we can merge partial updates
    const current = await db.query(
      'SELECT * FROM test_templates WHERE id = $1',
      [id]
    );

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found', code: 'NOT_FOUND' });
    }

    const existing = current.rows[0];

    const result = await db.query(
      `UPDATE test_templates
       SET test_name     = $1,
           category      = $2,
           report_type   = $3,
           template_data = $4,
           display_order = $5,
           is_active     = $6
       WHERE id = $7
       RETURNING id, test_name, category, report_type, template_data, display_order, is_active`,
      [
        test_name !== undefined    ? test_name.trim()                    : existing.test_name,
        category !== undefined     ? category.trim().toUpperCase()        : existing.category,
        report_type !== undefined  ? report_type                          : existing.report_type,
        parsedTemplateData !== undefined
          ? JSON.stringify(parsedTemplateData)
          : JSON.stringify(existing.template_data),
        display_order !== undefined ? display_order                       : existing.display_order,
        is_active !== undefined    ? is_active                            : existing.is_active,
        id,
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Failed to update template:', error);
    res.status(500).json({ error: 'Could not update template', code: 'UPDATE_FAILED' });
  }
});

// Group a flat list of templates into [ { category, templates: [...] }, ... ]
function groupTemplatesByCategory(templates) {
  const categoryMap = {};

  for (const template of templates) {
    if (!categoryMap[template.category]) {
      categoryMap[template.category] = [];
    }
    categoryMap[template.category].push(template);
  }

  return Object.entries(categoryMap).map(([category, templates]) => ({
    category,
    templates,
  }));
}

module.exports = router;
