/**
 * Utility functions for month-based calculations using a custom monthStartDay
 */

const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const monthUtils = {
  /**
   * Get the start date of the current month period based on monthStartDay
   * @param monthStartDay - The day of month (1-28) when the month period starts
   * @param referenceDate - The date to calculate the month period for (defaults to today)
   * @returns ISO string of the month period start date
   */
  getCurrentMonthStart: (monthStartDay: number, referenceDate: Date = new Date()): string => {
    let year = referenceDate.getFullYear();
    let month = referenceDate.getMonth();
    const day = referenceDate.getDate();

    if (day < monthStartDay) {
      // We're still in the previous month period
      month--;
      if (month < 0) {
        month = 11;
        year--;
      }
    }

    return toLocalDateString(new Date(year, month, monthStartDay));
  },

  /**
   * Get the end date of the current month period based on monthStartDay
   * @param monthStartDay - The day of month (1-28) when the month period starts
   * @param referenceDate - The date to calculate the month period for (defaults to today)
   * @returns ISO string of the month period end date (the day before next month starts)
   */
  getCurrentMonthEnd: (monthStartDay: number, referenceDate: Date = new Date()): string => {
    let year = referenceDate.getFullYear();
    let month = referenceDate.getMonth();
    const day = referenceDate.getDate();

    // Next period starts in the next calendar month relative to where the current period started
    let nextMonth = month + (day >= monthStartDay ? 1 : 0);
    let nextYear = year;

    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear++;
    }

    // End is the day before the next period starts
    return toLocalDateString(new Date(nextYear, nextMonth, monthStartDay - 1));
  },

  /**
   * Get all month periods that contain transactions in a date range
   * @param monthStartDay - The day of month (1-28) when the month period starts
   * @param startDate - ISO string of start date
   * @param endDate - ISO string of end date
   * @returns Array of tuples with [periodStart, periodEnd] ISO strings
   */
  getMonthPeriods: (monthStartDay: number, startDate: string, endDate: string): Array<[string, string]> => {
    const periods: Array<[string, string]> = [];
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    let current = new Date(start);

    while (current <= end) {
      const periodStart = monthUtils.getCurrentMonthStart(monthStartDay, current);
      const periodEnd = monthUtils.getCurrentMonthEnd(monthStartDay, current);

      if (periodEnd >= startDate && periodStart <= endDate) {
        const actualStart = periodStart < startDate ? startDate : periodStart;
        const actualEnd = periodEnd > endDate ? endDate : periodEnd;
        periods.push([actualStart, actualEnd]);
      }

      // Move to next period
      const [py, pm, pd] = periodEnd.split('-').map(Number);
      const next = new Date(py, pm - 1, pd + 1);
      current = next;
    }

    return periods;
  },

  /**
   * Get the month period containing a specific date
   * @param monthStartDay - The day of month (1-28) when the month period starts
   * @param date - ISO string of the date
   * @returns Tuple with [periodStart, periodEnd] ISO strings
   */
  getMonthPeriodForDate: (monthStartDay: number, date: string): [string, string] => {
    const [y, m, d] = date.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const periodStart = monthUtils.getCurrentMonthStart(monthStartDay, dateObj);
    const periodEnd = monthUtils.getCurrentMonthEnd(monthStartDay, dateObj);
    return [periodStart, periodEnd];
  },
};
