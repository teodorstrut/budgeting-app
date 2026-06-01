/**
 * Shared utilities for Google Sheets API calls.
 * Used by both syncService (transactions) and categorySyncService (categories).
 */

/**
 * Prevent formula injection when writing user-controlled strings to Google Sheets
 * with valueInputOption=USER_ENTERED. Strings that begin with =, +, -, @, tab, or
 * carriage-return are treated as formulas by Sheets; prefixing them with a single
 * quote forces Sheets to store the value as plain text.
 */
export const sanitizeForSheets = (value: string): string => {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
};

/** Adds the Bearer Authorization header and Content-Type to a fetch call. */
export const authorizedFetch = async (
  token: string,
  url: string,
  init?: RequestInit,
): Promise<Response> => {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
};

/** Maps common Google API HTTP status codes to user-friendly error messages. */
export const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  switch (response.status) {
    case 401: return 'Google authentication expired. Please sign out and sign in again.';
    case 403: return 'Access denied. Check that Google permissions are still granted.';
    case 404: return 'The spreadsheet or sheet was not found. Check your sync configuration.';
    case 429: return 'Too many requests. Wait a moment and try again.';
    default:
      return response.status >= 500 ? 'Google service error. Try again later.' : fallback;
  }
};
