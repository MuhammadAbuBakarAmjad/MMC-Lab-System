// All fetch calls for the dashboard resource

// Returns { reports_today, reports_this_month, total_patients, total_doctors }
export async function getDashboardStats() {
  const response = await fetch('/api/dashboard/stats');
  if (!response.ok) throw new Error('Failed to load dashboard stats');
  return response.json();
}

// Returns the last 10 reports with patient and doctor info
export async function getRecentReports() {
  const response = await fetch('/api/dashboard/recent');
  if (!response.ok) throw new Error('Failed to load recent reports');
  return response.json();
}

// Returns top 5 referring doctors this month with their report counts
export async function getTopDoctors() {
  const response = await fetch('/api/dashboard/top-doctors');
  if (!response.ok) throw new Error('Failed to load top doctors');
  return response.json();
}
