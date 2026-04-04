export const parseMaybeDate = (value: string): Date | null => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Formats a transaction amount with a +/- sign and two decimal places.
 * e.g. formatAmount(124.5, 'expense') => '-$124.50'
 */
export const formatAmount = (amount: number, type: 'income' | 'expense' | string): string => {
  const sign = type === 'income' ? '+' : '-';
  return `${sign}$${amount.toFixed(2)}`;
};

/**
 * Formats a time value as HH:MM (24h or 12h depending on locale).
 * Accepts either a Date object or an ISO date string.
 * When an ISO string without a time component is provided, returns 'All day'.
 */
export const formatTime = (value: Date | string): string => {
  if (value instanceof Date) {
    return value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  const date = parseMaybeDate(value);
  if (!date) {
    return 'Unknown time';
  }

  if (!value.includes('T')) {
    return 'All day';
  }

  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
};
