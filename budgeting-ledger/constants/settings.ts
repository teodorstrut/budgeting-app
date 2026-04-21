// Setting keys used across the app
export const SETTING_KEYS = {
  MONTH_START_DAY: 'monthStartDay',
  THEME: 'theme',
  GOOGLE_SYNC_ENABLED: 'googleSyncEnabled',
  GOOGLE_SPREADSHEET_NAME: 'googleSpreadsheetName',
  GOOGLE_SYNC_LAST_ERROR: 'googleSyncLastError',
  GOOGLE_SYNC_OWNER_KEY: 'googleSyncOwnerKey',
  GOOGLE_ACCOUNT_EMAIL: 'googleAccountEmail',
  GOOGLE_ACCOUNT_NAME: 'googleAccountName',
  GOOGLE_SYNC_SCHEMA_VERSION: 'googleSyncSchemaVersion',
  GOOGLE_AUTO_SYNC_ENABLED: 'googleAutoSyncEnabled',
  GOOGLE_AUTO_SYNC_LAST_LOCAL_DAY: 'googleAutoSyncLastLocalDay',
  GOOGLE_AUTO_SYNC_LAST_RUN_AT: 'googleAutoSyncLastRunAt',
} as const;

// Secure storage keys (expo-secure-store)
export const SECURE_KEYS = {
  GOOGLE_ACCESS_TOKEN: 'googleAccessToken',
  GOOGLE_ACCESS_TOKEN_EXPIRY: 'googleAccessTokenExpiry',
  GOOGLE_REFRESH_TOKEN: 'googleRefreshToken',
  GOOGLE_CLIENT_ID: 'googleClientId',
} as const;

// Sync constants
export const SYNC = {
  PROVIDER: 'google',
  DEFAULT_SHEET_NAME: 'BudgetingLedger_Transactions',
  SCHEMA_VERSION: '3',
  GOOGLE_SHEETS_SCOPE: 'https://www.googleapis.com/auth/spreadsheets',
} as const;
