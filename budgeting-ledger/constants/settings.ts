// Setting keys used across the app
export const SETTING_KEYS = {
  MONTH_START_DAY: 'monthStartDay',
  THEME: 'theme',
  GOOGLE_SYNC_ENABLED: 'googleSyncEnabled',
  GOOGLE_SPREADSHEET_NAME: 'googleSpreadsheetName',
  GOOGLE_SYNC_LAST_ERROR: 'googleSyncLastError',
  GOOGLE_SYNC_OWNER_KEY: 'googleSyncOwnerKey',
  GOOGLE_SYNC_SCHEMA_VERSION: 'googleSyncSchemaVersion',
} as const;

// Secure storage keys (expo-secure-store)
export const SECURE_KEYS = {
  GOOGLE_ACCESS_TOKEN: 'googleAccessToken',
  GOOGLE_ACCESS_TOKEN_EXPIRY: 'googleAccessTokenExpiry',
} as const;

// Sync constants
export const SYNC = {
  PROVIDER: 'google',
  DEFAULT_SHEET_NAME: 'BudgetingLedger_Transactions',
  SCHEMA_VERSION: '2',
  GOOGLE_SHEETS_SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
} as const;
