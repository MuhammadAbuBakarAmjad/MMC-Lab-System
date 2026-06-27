// All fetch calls for the settings resource
// Components import from here — never call fetch() directly in components

// Get the single lab settings row
export async function getSettings() {
  const response = await fetch('/api/settings');
  if (!response.ok) throw new Error('Failed to load settings');
  return response.json();
}

// Update the lab settings (always updates id = 1)
// settingsData: { lab_name, address, department, contact_no, footer_note }
export async function updateSettings(settingsData) {
  const response = await fetch('/api/settings', {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(settingsData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update settings');
  return data;
}
