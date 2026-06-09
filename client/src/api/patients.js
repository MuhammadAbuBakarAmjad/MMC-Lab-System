// All fetch calls for the patients resource
// Components import from here — never call fetch() directly in components

// Search patients by name, phone, or id
export async function searchPatients(query) {
  const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search patients');
  return response.json();
}

// Get a single patient by id
export async function getPatient(patientId) {
  const response = await fetch(`/api/patients/${patientId}`);
  if (!response.ok) throw new Error('Failed to load patient');
  return response.json();
}

// Get all reports for a patient
export async function getPatientReports(patientId) {
  const response = await fetch(`/api/patients/${patientId}/reports`);
  if (!response.ok) throw new Error('Failed to load patient reports');
  return response.json();
}

// Get all patients — used for the patients list page
export async function getAllPatients(query = '') {
  const url = query
    ? `/api/patients/search?q=${encodeURIComponent(query)}`
    : '/api/patients/search?q=';
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to load patients');
  return response.json();
}

// Create a new patient
export async function createPatient(patientData) {
  const response = await fetch('/api/patients', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patientData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create patient');
  return data;
}

// Update an existing patient
export async function updatePatient(patientId, patientData) {
  const response = await fetch(`/api/patients/${patientId}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(patientData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update patient');
  return data;
}
