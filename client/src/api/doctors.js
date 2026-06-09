// All fetch calls for the doctors resource

// Search doctors by name or phone
export async function searchDoctors(query) {
  const response = await fetch(`/api/doctors/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error('Failed to search doctors');
  return response.json();
}

// Get all doctors — used for filter dropdowns
export async function getAllDoctors() {
  const response = await fetch('/api/doctors');
  if (!response.ok) throw new Error('Failed to load doctors');
  return response.json();
}

// Create a new doctor
export async function createDoctor(doctorData) {
  const response = await fetch('/api/doctors', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(doctorData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create doctor');
  return data;
}
