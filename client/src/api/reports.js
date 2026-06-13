// All fetch calls for the reports resource
// Components import from here — never call fetch() directly in components

// Get the next available lab number to pre-fill the Lab No field
export async function getNextLabNo() {
  const response = await fetch('/api/reports/next-lab-no');
  if (!response.ok) throw new Error('Failed to get next lab number');
  return response.json();
}

// Get a paginated, filtered list of reports
// filters: { q, from, to, doctor_id, status, page, limit }
export async function getReports(filters = {}) {
  const params = new URLSearchParams();
  if (filters.q)          params.set('q',          filters.q);
  if (filters.search_by)  params.set('search_by',  filters.search_by);
  if (filters.from)       params.set('from',        filters.from);
  if (filters.to)         params.set('to',          filters.to);
  if (filters.doctor_id)  params.set('doctor_id',   filters.doctor_id);
  if (filters.status)     params.set('status',      filters.status);
  if (filters.page)       params.set('page',        filters.page);
  if (filters.limit)      params.set('limit',       filters.limit);

  const response = await fetch(`/api/reports?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to load reports');
  return response.json();
}

// Get a single report with all its results and patient/doctor info
export async function getReportById(id) {
  const response = await fetch(`/api/reports/${id}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to load report');
  }
  return response.json();
}

// Delete a report permanently
export async function deleteReport(id) {
  const response = await fetch(`/api/reports/${id}`, { method: 'DELETE' });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to delete report');
  }
  return response.json();
}

// Update an existing draft report — replaces all results
// Payload: { lab_no, patient_id, doctor_id, report_date, status, results }
export async function updateReport(id, payload) {
  const response = await fetch(`/api/reports/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to update report');
  return data;
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
