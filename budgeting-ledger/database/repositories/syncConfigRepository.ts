import db from '../connection';
import { SyncConfig, SyncStatus } from '../../types/sync';

interface SyncConfigRow {
  id: number;
  provider: 'google';
  spreadsheetId: string | null;
  sheetName: string | null;
  lastSync: string | null;
  status: SyncStatus | null;
}

const toSyncConfig = (row: SyncConfigRow | null): SyncConfig | null => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    provider: row.provider,
    spreadsheetId: row.spreadsheetId ?? undefined,
    sheetName: row.sheetName ?? undefined,
    lastSync: row.lastSync ?? undefined,
    status: row.status ?? 'inactive',
  };
};

export const syncConfigRepository = {
  getGoogleConfig: (): SyncConfig | null => {
    const row = db.getFirstSync('SELECT * FROM sync_configs WHERE provider = ? LIMIT 1', ['google']) as SyncConfigRow | null;
    return toSyncConfig(row);
  },

  upsertGoogleConfig: (config: Partial<Omit<SyncConfig, 'provider'>>): void => {
    const existing = syncConfigRepository.getGoogleConfig();

    const spreadsheetId =
      Object.prototype.hasOwnProperty.call(config, 'spreadsheetId')
        ? config.spreadsheetId ?? null
        : existing?.spreadsheetId ?? null;
    const sheetName =
      Object.prototype.hasOwnProperty.call(config, 'sheetName')
        ? config.sheetName ?? null
        : existing?.sheetName ?? null;
    const lastSync =
      Object.prototype.hasOwnProperty.call(config, 'lastSync')
        ? config.lastSync ?? null
        : existing?.lastSync ?? null;
    const status = config.status ?? existing?.status ?? 'inactive';

    if (existing?.id != null) {
      db.runSync(
        'UPDATE sync_configs SET spreadsheetId = ?, sheetName = ?, lastSync = ?, status = ? WHERE id = ?',
        [spreadsheetId, sheetName, lastSync, status, existing.id]
      );
      return;
    }

    db.runSync(
      'INSERT INTO sync_configs (provider, spreadsheetId, sheetName, lastSync, status) VALUES (?, ?, ?, ?, ?)',
      ['google', spreadsheetId, sheetName, lastSync, status]
    );
  },

  setGoogleStatus: (status: SyncStatus): void => {
    syncConfigRepository.upsertGoogleConfig({ status });
  },
};
