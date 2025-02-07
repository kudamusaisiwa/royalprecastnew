import { startOfToday, endOfToday, startOfYesterday, endOfYesterday, subDays, subMonths, startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export function getDateRange(
  timeRange: string,
  customStartDate: Date | null = null,
  customEndDate: Date | null = null
): DateRange {
  // If custom dates are provided and timeRange is 'custom', use them
  if (timeRange === 'custom' && customStartDate && customEndDate) {
    return {
      startDate: startOfDay(customStartDate),
      endDate: endOfDay(customEndDate)
    };
  }

  switch (timeRange) {
    case 'today':
      return {
        startDate: startOfToday(),
        endDate: endOfToday()
      };

    case 'yesterday':
      return {
        startDate: startOfYesterday(),
        endDate: endOfYesterday()
      };

    case '7d': {
      return {
        startDate: startOfDay(subDays(new Date(), 6)), // Last 7 days including today
        endDate: endOfToday()
      };
    }

    case '30d':
      return {
        startDate: startOfDay(subDays(new Date(), 29)), // Last 30 days including today
        endDate: endOfToday()
      };

    case '3m':
      return {
        startDate: startOfDay(subMonths(new Date(), 3)),
        endDate: endOfToday()
      };

    case '12m':
      return {
        startDate: startOfDay(subMonths(new Date(), 12)),
        endDate: endOfToday()
      };

    default:
      // Default to last 7 days if invalid range
      return {
        startDate: startOfDay(subDays(new Date(), 6)),
        endDate: endOfToday()
      };
  }
}

export function getDatesInRange(startDate: Date, endDate: Date): Date[] {
  return eachDayOfInterval({ start: startDate, end: endDate });
}

export function formatDateForDisplay(date: Date, timeRange: string): string {
  if (timeRange === 'today' || timeRange === 'yesterday') {
    return format(date, 'HH:mm');
  }

  if (timeRange === '7d') {
    return format(date, 'EEE');
  }

  if (timeRange === '30d') {
    return format(date, 'dd MMM');
  }

  if (timeRange === '3m' || timeRange === '12m') {
    return format(date, 'MMM yyyy');
  }

  // Default format for custom range
  return format(date, 'dd MMM yyyy');
}