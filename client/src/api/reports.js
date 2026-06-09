// All fetch calls for the reports resource
// Components import from here — never call fetch() directly in components

// Get the next available lab number to pre-fill the Lab No field
export async function getNextLabNo() {
  const response = await fetch('/api/reports/next-lab-no');
  if (!response.ok) throw new Error('Failed to get next lab number');
  return response.json();
}

// Create a new report with its test results
// Payload: { lab_no, patient_id, doctor_id, report_date, status, results }
export async function createReport(payload) {
  const response = await fetch('/api/reports', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to create report');
  return data;
}
