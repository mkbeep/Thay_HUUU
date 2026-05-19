/**
 * Date range helpers for reports (local timezone, start/end of day).
 */
import type { ReportPeriod } from '../../application/dto/ReportDTO';

export interface DateRange {
  start: Date;
  end: Date;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Week starts on Monday (ISO-style). */
export function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const x = new Date(d);
  x.setDate(d.getDate() + diff);
  return startOfDay(x);
}

export function startOfMonth(d: Date): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function endOfMonth(d: Date): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function getReportDateRanges(
  period: ReportPeriod,
  customFrom?: string,
  customTo?: string
): { current: DateRange; previous: DateRange | null } {
  const now = new Date();

  switch (period) {
    case 'today': {
      const currentStart = startOfDay(now);
      const currentEnd = endOfDay(now);
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        current: { start: currentStart, end: currentEnd },
        previous: { start: startOfDay(yesterday), end: endOfDay(yesterday) },
      };
    }
    case 'week': {
      const currentStart = startOfWeek(now);
      const currentEnd = endOfDay(now);
      const prevWeekEnd = new Date(currentStart);
      prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
      const prevWeekStart = startOfWeek(prevWeekEnd);
      return {
        current: { start: currentStart, end: currentEnd },
        previous: { start: prevWeekStart, end: endOfDay(prevWeekEnd) },
      };
    }
    case 'month': {
      const currentStart = startOfMonth(now);
      const currentEnd = endOfDay(now);
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return {
        current: { start: currentStart, end: currentEnd },
        previous: {
          start: startOfMonth(prevMonth),
          end: endOfMonth(prevMonth),
        },
      };
    }
    case 'custom': {
      if (!customFrom || !customTo) {
        throw new Error('CUSTOM_RANGE_REQUIRED');
      }
      const from = startOfDay(new Date(customFrom));
      const to = endOfDay(new Date(customTo));
      if (from > to) {
        throw new Error('INVALID_DATE_RANGE');
      }
      return {
        current: { start: from, end: to },
        previous: null,
      };
    }
    default:
      throw new Error('INVALID_PERIOD');
  }
}

/** Union range covering current + previous periods for a single Firestore fetch. */
export function getFetchRange(
  current: DateRange,
  previous: DateRange | null
): DateRange {
  if (!previous) return current;
  return {
    start: previous.start < current.start ? previous.start : current.start,
    end: previous.end > current.end ? previous.end : current.end,
  };
}
