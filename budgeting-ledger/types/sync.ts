export type SyncProvider = 'google';

export type SyncStatus = 'active' | 'inactive' | 'syncing' | 'error';

export interface SyncConfig {
  id?: number;
  provider: SyncProvider;
  spreadsheetId?: string;
  spreadsheetName?: string;
  sheetName?: string;
  lastSync?: string;
  status: SyncStatus;
  lastError?: string;
}

export interface GoogleSpreadsheet {
  id: string;
  name: string;
}

export interface GoogleSpreadsheetPage {
  items: GoogleSpreadsheet[];
  nextPageToken?: string;
}

export interface SyncRow {
  id: number;
  name: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  datetime: string;
  updatedAt: string;
}
