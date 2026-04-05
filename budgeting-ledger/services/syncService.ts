import * as SecureStore from 'expo-secure-store';
import { syncConfigRepository } from '../database/repositories/syncConfigRepository';
import { transactionService } from './transactionService';
import { settingsService } from './settingsService';
import { GoogleSpreadsheet, SyncConfig, SyncRow } from '../types/sync';

const GOOGLE_TOKEN_STORAGE_KEY = 'googleAccessToken';
const GOOGLE_TOKEN_EXPIRY_KEY = 'googleAccessTokenExpiry';
const GOOGLE_SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const DEFAULT_SHEET_NAME = 'BudgetingLedger_Transactions';
const GOOGLE_SYNC_SCHEMA_VERSION = '2';

interface GoogleSheetSummaryResponse {
  spreadsheetId: string;
  properties?: {
    title?: string;
  };
}

interface GoogleSpreadsheetsListResponse {
  files?: Array<{
    id?: string;
    name?: string;
    mimeType?: string;
  }>;
}

interface SpreadsheetDetailsResponse {
  sheets?: Array<{
    properties?: {
      title?: string;
    };
  }>;
}

interface GoogleSheetValuesResponse {
  values?: string[][];
}

const makeSyncKey = (ownerKey: string, localId: number): string => `${ownerKey}::${localId}`;

const authorizedFetch = async (
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

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    return body.error?.message ?? fallback;
  } catch {
    return fallback;
  }
};

export const syncService = {
  googleSheetsScope: GOOGLE_SHEETS_SCOPE,

  getDefaultSheetName: (): string => DEFAULT_SHEET_NAME,

  getGoogleAccessToken: async (): Promise<string | null> => {
    const token = await SecureStore.getItemAsync(GOOGLE_TOKEN_STORAGE_KEY);
    if (!token) return null;
    const expiryStr = await SecureStore.getItemAsync(GOOGLE_TOKEN_EXPIRY_KEY);
    if (expiryStr) {
      const expiry = Number(expiryStr);
      if (!Number.isNaN(expiry) && Date.now() / 1000 >= expiry - 60) {
        await SecureStore.deleteItemAsync(GOOGLE_TOKEN_STORAGE_KEY);
        await SecureStore.deleteItemAsync(GOOGLE_TOKEN_EXPIRY_KEY);
        return null;
      }
    }
    return token;
  },

  setGoogleAccessToken: async (token: string, expiresAt?: number): Promise<void> => {
    await SecureStore.setItemAsync(GOOGLE_TOKEN_STORAGE_KEY, token);
    if (expiresAt != null) {
      await SecureStore.setItemAsync(GOOGLE_TOKEN_EXPIRY_KEY, String(expiresAt));
    }
  },

  clearGoogleSession: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(GOOGLE_TOKEN_STORAGE_KEY);
    await SecureStore.deleteItemAsync(GOOGLE_TOKEN_EXPIRY_KEY);
    settingsService.setGoogleSyncEnabled(false);
    settingsService.clearGoogleLastError();
    syncConfigRepository.upsertGoogleConfig({
      status: 'inactive',
      spreadsheetId: undefined,
      sheetName: undefined,
      lastSync: undefined,
    });
  },

  getGoogleSyncConfig: (): SyncConfig => {
    const config = syncConfigRepository.getGoogleConfig();
    return {
      provider: 'google',
      status: config?.status ?? 'inactive',
      spreadsheetId: config?.spreadsheetId,
      sheetName: config?.sheetName,
      lastSync: config?.lastSync,
      spreadsheetName: settingsService.getGoogleSpreadsheetName() ?? undefined,
      lastError: settingsService.getGoogleLastError() ?? undefined,
      id: config?.id,
    };
  },

  setGoogleSyncEnabled: (enabled: boolean): void => {
    settingsService.setGoogleSyncEnabled(enabled);
    syncConfigRepository.upsertGoogleConfig({ status: enabled ? 'active' : 'inactive' });
  },

  saveGoogleSheetSelection: (args: {
    spreadsheetId: string;
    spreadsheetName: string;
    sheetName: string;
  }): void => {
    syncConfigRepository.upsertGoogleConfig({
      spreadsheetId: args.spreadsheetId,
      sheetName: args.sheetName,
      status: settingsService.getGoogleSyncEnabled() ? 'active' : 'inactive',
    });
    settingsService.setGoogleSpreadsheetName(args.spreadsheetName);
    settingsService.clearGoogleLastError();
  },

  listSpreadsheets: async (token: string): Promise<GoogleSpreadsheet[]> => {
    const response = await authorizedFetch(
      token,
      'https://www.googleapis.com/drive/v3/files?q=mimeType%3D%22application%2Fvnd.google-apps.spreadsheet%22&fields=files(id%2Cname%2CmimeType)&pageSize=100',
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Failed to list spreadsheets.'));
    }

    const data = (await response.json()) as GoogleSpreadsheetsListResponse;
    return (data.files ?? [])
      .filter((file): file is { id: string; name: string; mimeType?: string } => !!file.id && !!file.name)
      .map((file) => ({ id: file.id, name: file.name }));
  },

  createSpreadsheet: async (token: string, title: string): Promise<GoogleSpreadsheet> => {
    const response = await authorizedFetch(token, 'https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      body: JSON.stringify({
        properties: { title },
      }),
    });

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Failed to create spreadsheet.'));
    }

    const data = (await response.json()) as GoogleSheetSummaryResponse;
    if (!data.spreadsheetId) {
      throw new Error('Google API did not return a spreadsheet ID.');
    }

    return {
      id: data.spreadsheetId,
      name: data.properties?.title ?? title,
    };
  },

  ensureAppSheetTab: async (
    token: string,
    spreadsheetId: string,
    preferredSheetName: string = DEFAULT_SHEET_NAME,
  ): Promise<string> => {
    const encodedId = encodeURIComponent(spreadsheetId);
    const detailsResponse = await authorizedFetch(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodedId}?fields=sheets(properties(title))`,
    );

    if (!detailsResponse.ok) {
      throw new Error(await parseErrorMessage(detailsResponse, 'Failed to inspect spreadsheet tabs.'));
    }

    const details = (await detailsResponse.json()) as SpreadsheetDetailsResponse;
    const existingTitles = (details.sheets ?? [])
      .map((sheet) => sheet.properties?.title)
      .filter((title): title is string => !!title);

    if (existingTitles.includes(preferredSheetName)) {
      return preferredSheetName;
    }

    const createTabResponse = await authorizedFetch(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodedId}:batchUpdate`,
      {
        method: 'POST',
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: preferredSheetName,
                },
              },
            },
          ],
        }),
      },
    );

    if (!createTabResponse.ok) {
      throw new Error(await parseErrorMessage(createTabResponse, 'Failed to create app tab in spreadsheet.'));
    }

    await syncService.initializeSheetHeader(token, spreadsheetId, preferredSheetName);
    return preferredSheetName;
  },

  initializeSheetHeader: async (
    token: string,
    spreadsheetId: string,
    sheetName: string,
  ): Promise<void> => {
    const response = await authorizedFetch(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(
        `${sheetName}!A1:J1`,
      )}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [[
            'Sync Key',
            'Owner Key',
            'Local ID',
            'Name',
            'Type',
            'Category',
            'Amount',
            'Datetime',
            'Updated At',
            'Deleted At',
          ]],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Failed to initialize sheet header.'));
    }
  },

  syncTransactionsToGoogleSheet: async (token: string): Promise<{ rowsPushed: number; at: string }> => {
    const config = syncService.getGoogleSyncConfig();

    if (!config.spreadsheetId || !config.sheetName) {
      throw new Error('Spreadsheet is not configured.');
    }

    syncConfigRepository.setGoogleStatus('syncing');
    settingsService.clearGoogleLastError();

    const encodedSheetId = encodeURIComponent(config.spreadsheetId);
    const sheetName = config.sheetName;
    const ownerKey = settingsService.ensureSyncOwnerKey();

    const rowToValues = (row: SyncRow): (string | number)[] => [
      makeSyncKey(ownerKey, row.id),
      ownerKey,
      row.id,
      row.name,
      row.type,
      row.category,
      row.amount,
      row.datetime,
      row.updatedAt,
      '',
    ];

    const deletedRowValues = (id: number, deletedAt: string): (string | number)[] => [
      makeSyncKey(ownerKey, id),
      ownerKey,
      id,
      '(deleted)',
      '',
      '',
      '',
      '',
      deletedAt,
      deletedAt,
    ];

    try {
      await syncService.initializeSheetHeader(token, config.spreadsheetId, sheetName);
      const isFirstSync = !config.lastSync;
      const needsSchemaMigration = settingsService.getSetting('googleSyncSchemaVersion') !== GOOGLE_SYNC_SCHEMA_VERSION;

      if (isFirstSync || needsSchemaMigration) {
        // ── Full write ──────────────────────────────────────────────────────
        const allRows = transactionService.getRowsForGoogleSync();

        const clearResponse = await authorizedFetch(
          token,
          `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
            `${sheetName}!A2:J`,
          )}:clear`,
          { method: 'POST' },
        );
        if (!clearResponse.ok) {
          throw new Error(await parseErrorMessage(clearResponse, 'Failed to clear existing sheet data.'));
        }

        if (allRows.length > 0) {
          const writeResponse = await authorizedFetch(
            token,
            `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
              `${sheetName}!A2`,
            )}?valueInputOption=USER_ENTERED`,
            {
              method: 'PUT',
              body: JSON.stringify({ values: allRows.map(rowToValues) }),
            },
          );
          if (!writeResponse.ok) {
            throw new Error(await parseErrorMessage(writeResponse, 'Failed to write transactions to Google Sheet.'));
          }
        }

        const at = new Date().toISOString();
        syncConfigRepository.upsertGoogleConfig({
          status: settingsService.getGoogleSyncEnabled() ? 'active' : 'inactive',
          lastSync: at,
        });
        settingsService.setSetting('googleSyncSchemaVersion', GOOGLE_SYNC_SCHEMA_VERSION);
        return { rowsPushed: allRows.length, at };
      }

      // ── Incremental sync ────────────────────────────────────────────────
      const changedRows = transactionService.getRowsChangedSince(config.lastSync!);
      const deletedRows = transactionService.getDeletedRowsChangedSince(config.lastSync!);

      if (changedRows.length === 0 && deletedRows.length === 0) {
        const at = new Date().toISOString();
        syncConfigRepository.upsertGoogleConfig({
          status: settingsService.getGoogleSyncEnabled() ? 'active' : 'inactive',
          lastSync: at,
        });
        return { rowsPushed: 0, at };
      }

      // Read existing sync key column to map owner+transactionId → sheet row number
      const keyColumnResponse = await authorizedFetch(
        token,
        `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
          `${sheetName}!A:A`,
        )}`,
      );
      if (!keyColumnResponse.ok) {
        throw new Error(await parseErrorMessage(keyColumnResponse, 'Failed to read existing sheet sync keys.'));
      }
      const keyColumnData = (await keyColumnResponse.json()) as GoogleSheetValuesResponse;
      // Build map: syncKey → 1-based sheet row number (row 1 = header)
      const keyToRow = new Map<string, number>();
      (keyColumnData.values ?? []).forEach((cell, index) => {
        if (index === 0) return; // skip header
        const key = (cell[0] ?? '').trim();
        if (key) {
          keyToRow.set(key, index + 1); // 1-based
        }
      });

      const toUpdateActive = changedRows.filter((r) => keyToRow.has(makeSyncKey(ownerKey, r.id)));
      const toAppendActive = changedRows.filter((r) => !keyToRow.has(makeSyncKey(ownerKey, r.id)));
      const toUpdateDeleted = deletedRows.filter((r) => keyToRow.has(makeSyncKey(ownerKey, r.id)));

      // Update changed rows in-place via batchUpdate.
      if (toUpdateActive.length > 0 || toUpdateDeleted.length > 0) {
        const updateData = [
          ...toUpdateActive.map((row) => {
            const syncKey = makeSyncKey(ownerKey, row.id);
            return {
              range: `${sheetName}!A${keyToRow.get(syncKey)}:J${keyToRow.get(syncKey)}`,
              values: [rowToValues(row)],
            };
          }),
          ...toUpdateDeleted.map((row) => {
            const syncKey = makeSyncKey(ownerKey, row.id);
            return {
              range: `${sheetName}!A${keyToRow.get(syncKey)}:J${keyToRow.get(syncKey)}`,
              values: [deletedRowValues(row.id, row.deletedAt)],
            };
          }),
        ];

        const batchResponse = await authorizedFetch(
          token,
          `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values:batchUpdate`,
          {
            method: 'POST',
            body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: updateData }),
          },
        );
        if (!batchResponse.ok) {
          throw new Error(await parseErrorMessage(batchResponse, 'Failed to update changed rows in Google Sheet.'));
        }
      }

      // Append genuinely new active rows.
      if (toAppendActive.length > 0) {
        const appendResponse = await authorizedFetch(
          token,
          `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
            `${sheetName}!A:J`,
          )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
          {
            method: 'POST',
            body: JSON.stringify({ values: toAppendActive.map(rowToValues) }),
          },
        );
        if (!appendResponse.ok) {
          throw new Error(await parseErrorMessage(appendResponse, 'Failed to append new transactions to Google Sheet.'));
        }
      }

      const at = new Date().toISOString();
      syncConfigRepository.upsertGoogleConfig({
        status: settingsService.getGoogleSyncEnabled() ? 'active' : 'inactive',
        lastSync: at,
      });
      settingsService.setSetting('googleSyncSchemaVersion', GOOGLE_SYNC_SCHEMA_VERSION);
      return { rowsPushed: changedRows.length + deletedRows.length, at };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync failure';
      syncConfigRepository.setGoogleStatus('error');
      settingsService.setGoogleLastError(message);
      throw error;
    }
  },
};
