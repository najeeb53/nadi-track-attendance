
// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// Get today's date in YYYY-MM-DD format
export function getToday(): string {
  return formatDate(new Date());
}

// Get the start of the current week
export function getStartOfWeek(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  
  return formatDate(new Date(date.setDate(diff)));
}

// Get the end of the current week
export function getEndOfWeek(): string {
  const date = new Date();
  const day = date.getDay();
  const diff = date.getDate() + (day === 0 ? 0 : 7 - day);
  
  return formatDate(new Date(date.setDate(diff)));
}

// Get the start of the current month
export function getStartOfMonth(): string {
  const date = new Date();
  date.setDate(1);
  
  return formatDate(date);
}

// Get the end of the current month
export function getEndOfMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 0);
  
  return formatDate(date);
}

// Get the day name from a date string
export function getDayName(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

// Get formatted date (e.g., "May 5, 2023")
export function getFormattedDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Get dates between start and end dates
export function getDatesBetween(startDate: string, endDate: string): string[] {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dateArray = [];
  
  let currentDate = new Date(start);
  while (currentDate <= end) {
    dateArray.push(formatDate(new Date(currentDate)));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dateArray;
}
