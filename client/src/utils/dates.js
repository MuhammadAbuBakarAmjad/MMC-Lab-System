// Date formatting utilities
// Store dates as YYYY-MM-DD, display as DD/MM/YYYY throughout the app

// Convert YYYY-MM-DD to DD/MM/YYYY for display
export function formatDateForDisplay(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

// Get today's date as YYYY-MM-DD for use in date inputs
export function getTodayAsInputValue() {
  const today = new Date();
  const year  = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day   = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
