export const parseMaybeDate = (value: string): Date | null => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

/**
 * Formats a date string as a human-readable relative time (e.g. "3 hours ago").
 */
export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (Number.isNaN(diffMs) || diffMs < 0) {
    return 'just now';
  }

  const hourMs = 60 * 60 * 1000;
  const dayMs = 24 * hourMs;
  const weekMs = 7 * dayMs;

  if (diffMs < hourMs) {
    const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  if (diffMs < weekMs) {
    const days = Math.floor(diffMs / dayMs);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  const months =
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth());

  if (months < 1) {
    const weeks = Math.floor(diffMs / weekMs);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }

  return `${months} ${months === 1 ? 'month' : 'months'} ago`;
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
