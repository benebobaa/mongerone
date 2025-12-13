import { format, subMonths, startOfMonth, endOfMonth, addDays, addWeeks, addMonths, addYears } from 'date-fns';

export function formatDate(date: Date | string, formatStr: string = 'MMM dd, yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

export function getDateRange(range: 'week' | 'month' | 'year' | 'all'): { start: Date; end: Date } {
  const end = new Date();
  let start = new Date();

  switch (range) {
    case 'week':
      start = subMonths(end, 0);
      start.setDate(start.getDate() - 7);
      break;
    case 'month':
      start = startOfMonth(end);
      break;
    case 'year':
      start = subMonths(end, 12);
      break;
    case 'all':
      start = new Date(2000, 0, 1); // Arbitrary old date
      break;
  }

  return { start, end };
}

export function calculateNextRunDate(
  lastRunDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  interval: number = 1
): Date {
  const date = new Date(lastRunDate);

  switch (frequency) {
    case 'daily':
      return addDays(date, interval);
    case 'weekly':
      return addWeeks(date, interval);
    case 'monthly':
      return addMonths(date, interval);
    case 'yearly':
      return addYears(date, interval);
    default:
      return date;
  }
}
