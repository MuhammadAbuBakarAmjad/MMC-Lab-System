// Date formatting utilities
// Store dates as YYYY-MM-DD, display as DD/MM/YYYY throughout the app

// Convert YYYY-MM-DD to DD/MM/YYYY for display
export function formatDateForDisplay(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('T')[0].split('-');
  return `${day}/${month}/${year}`;
}

// Format a timestamp to 12-hour AM/PM format — used for finalized_at and print time on reports
export function formatTimeForDisplay(isoTimestamp) {
  if (!isoTimestamp) return '';
  const date    = new Date(isoTimestamp);
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm    = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;
  return `${hours12}:${minutes} ${ampm}`;
}

// Get today's date as YYYY-MM-DD for use in date inputs
export function getTodayAsInputValue() {
  const today = new Date();
  const year  = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day   = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
