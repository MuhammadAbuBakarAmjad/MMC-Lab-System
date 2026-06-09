// All fetch calls for the templates resource
// Components import from here — never call fetch() directly in components

// Get all active templates grouped by category
// Returns: [ { category: "HAEMATOLOGY", templates: [...] }, ... ]
export async function getActiveTemplatesGrouped() {
  const response = await fetch('/api/templates');
  if (!response.ok) throw new Error('Failed to load templates');
  return response.json();
}

// Get all templates including inactive — used by the Settings page
export async function getAllTemplates() {
  const response = await fetch('/api/templates/all');
  if (!response.ok) throw new Error('Failed to load templates');
  return response.json();
}

// Create a new test template
export async function createTemplate(templateData) {
  const response = await fetch('/api/templates', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(templateData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create template');
  return data;
}

// Update a template — used for toggling active/inactive and editing
export async function updateTemplate(templateId, updates) {
  const response = await fetch(`/api/templates/${templateId}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(updates),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update template');
  return data;
}
