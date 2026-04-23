import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { syncConfigRepository } from '../database/repositories/syncConfigRepository';
import { syncDeletionRepository } from '../database/repositories/syncDeletionRepository';
import { transactionService } from './transactionService';
import { settingsService } from './settingsService';
import { GoogleSpreadsheet, GoogleSpreadsheetPage, SyncConfig, SyncRow } from '../types/sync';
import { SECURE_KEYS, SETTING_KEYS, SYNC } from '../constants/settings';

type ExtraConfig = { googleAuth?: { androidClientId?: string; iosClientId?: string } };

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
  nextPageToken?: string;
}

interface GoogleUserProfileResponse {
  email?: string;
  name?: string;
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

const formatAmountForExport = (amount: number): string => {
  return String(amount).replace('.', ',');
};

/**
 * Prevent formula injection when writing user-controlled strings to Google Sheets
 * with valueInputOption=USER_ENTERED. Strings that begin with =, +, -, @, tab, or
 * carriage-return are treated as formulas by Sheets; prefixing them with a single
 * quote forces Sheets to store the value as plain text.
 */
const sanitizeForSheets = (value: string): string => {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
};

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
  switch (response.status) {
    case 401: return 'Google authentication expired. Please sign out and sign in again.';
    case 403: return 'Access denied. Check that Google permissions are still granted.';
    case 404: return 'The spreadsheet or sheet was not found. Check your sync configuration.';
    case 429: return 'Too many requests. Wait a moment and try again.';
    default:
      return response.status >= 500 ? 'Google service error. Try again later.' : fallback;
  }
};

export const syncService = {
  googleSheetsScope: SYNC.GOOGLE_SHEETS_SCOPE,

  getDefaultSheetName: (): string => SYNC.DEFAULT_SHEET_NAME,

  getGoogleAccessToken: async (): Promise<string | null> => {
    const token = await SecureStore.getItemAsync(SECURE_KEYS.GOOGLE_ACCESS_TOKEN);
    if (!token) return null;
    const expiryStr = await SecureStore.getItemAsync(SECURE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRY);
    if (expiryStr) {
      const expiry = Number(expiryStr);
      if (!Number.isNaN(expiry) && Date.now() / 1000 >= expiry - 60) {
        await SecureStore.deleteItemAsync(SECURE_KEYS.GOOGLE_ACCESS_TOKEN);
        await SecureStore.deleteItemAsync(SECURE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRY);
        return syncService.refreshGoogleAccessToken();
      }
    }
    return token;
  },

  refreshGoogleAccessToken: async (): Promise<string | null> => {
    const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.GOOGLE_REFRESH_TOKEN);
    if (!refreshToken) return null;
    const extraConfig = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;
    const clientId =
      Platform.OS === 'android'
        ? extraConfig.googleAuth?.androidClientId
        : extraConfig.googleAuth?.iosClientId;
    if (!clientId) return null;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
        }).toString(),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as {
        access_token?: string;
        expires_in?: number;
      };

      if (!data.access_token) return null;

      const expiresAt = data.expires_in != null ? Math.floor(Date.now() / 1000) + data.expires_in : undefined;
      await syncService.setGoogleAccessToken(data.access_token, expiresAt);
      return data.access_token;
    } catch {
      return null;
    }
  },

  setGoogleRefreshToken: async (refreshToken: string): Promise<void> => {
    await SecureStore.setItemAsync(SECURE_KEYS.GOOGLE_REFRESH_TOKEN, refreshToken);
  },

  setGoogleAccessToken: async (token: string, expiresAt?: number): Promise<void> => {
    await SecureStore.setItemAsync(SECURE_KEYS.GOOGLE_ACCESS_TOKEN, token);
    if (expiresAt != null) {
      await SecureStore.setItemAsync(SECURE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRY, String(expiresAt));
    }
  },

  setGoogleAccountProfile: async (profile: { email: string; name: string }): Promise<void> => {
    await settingsService.setGoogleAccountEmail(profile.email);
    await settingsService.setGoogleAccountName(profile.name);
  },

  getGoogleAccountProfile: async (): Promise<{ email: string | null; name: string | null }> => {
    return {
      email: await settingsService.getGoogleAccountEmail(),
      name: await settingsService.getGoogleAccountName(),
    };
  },

  clearGoogleSession: async (): Promise<void> => {
    // Best-effort revoke the refresh token at Google before clearing locally
    try {
      const refreshToken = await SecureStore.getItemAsync(SECURE_KEYS.GOOGLE_REFRESH_TOKEN);
      if (refreshToken) {
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`,
          { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
        );
      }
    } catch {
      // Revocation is best-effort; local tokens are still deleted below
    }
    await SecureStore.deleteItemAsync(SECURE_KEYS.GOOGLE_ACCESS_TOKEN);
    await SecureStore.deleteItemAsync(SECURE_KEYS.GOOGLE_ACCESS_TOKEN_EXPIRY);
    await SecureStore.deleteItemAsync(SECURE_KEYS.GOOGLE_REFRESH_TOKEN);
    await settingsService.clearGoogleAccountProfile();
    settingsService.setGoogleAutoSyncLastLocalDay('');
    settingsService.setGoogleAutoSyncLastRunAt('');
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
      status: 'active',
    });
    settingsService.setGoogleSpreadsheetName(args.spreadsheetName);
    settingsService.clearGoogleLastError();
  },

  listSpreadsheets: async (token: string, pageToken?: string): Promise<GoogleSpreadsheetPage> => {
    const params = new URLSearchParams({
      q: 'mimeType="application/vnd.google-apps.spreadsheet"',
      fields: 'files(id,name,mimeType),nextPageToken',
      pageSize: '10',
    });
    if (pageToken) {
      params.set('pageToken', pageToken);
    }

    const response = await authorizedFetch(
      token,
      `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Failed to list spreadsheets.'));
    }

    const data = (await response.json()) as GoogleSpreadsheetsListResponse;
    return {
      items: (data.files ?? [])
      .filter((file): file is { id: string; name: string; mimeType?: string } => !!file.id && !!file.name)
      .map((file) => ({ id: file.id, name: file.name })),
      nextPageToken: data.nextPageToken,
    };
  },

  fetchGoogleUserProfile: async (token: string): Promise<{ email: string; name: string }> => {
    const response = await authorizedFetch(token, 'https://www.googleapis.com/oauth2/v2/userinfo');
    if (!response.ok) {
      throw new Error(await parseErrorMessage(response, 'Failed to fetch Google account profile.'));
    }

    const data = (await response.json()) as GoogleUserProfileResponse;
    const email = (data.email ?? '').trim();
    const name = (data.name ?? '').trim();

    if (!email) {
      throw new Error('Google account email is required for sync key generation.');
    }

    return {
      email,
      name: name || email,
    };
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
    preferredSheetName: string = SYNC.DEFAULT_SHEET_NAME,
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
        `${sheetName}!A1:I1`,
      )}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [[
            'Sync Key',
            'Owner Key',
            'Note',
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
      sanitizeForSheets(makeSyncKey(ownerKey, row.id)),
      sanitizeForSheets(ownerKey),
      sanitizeForSheets(row.name),
      sanitizeForSheets(row.type),
      sanitizeForSheets(row.category),
      sanitizeForSheets(formatAmountForExport(row.amount)),
      sanitizeForSheets(row.datetime),
      sanitizeForSheets(row.updatedAt),
      '',
    ];

    const deletedRowValues = (id: number, deletedAt: string): (string | number)[] => [
      sanitizeForSheets(makeSyncKey(ownerKey, id)),
      sanitizeForSheets(ownerKey),
      '(deleted)',
      '',
      '',
      '',
      sanitizeForSheets(deletedAt),
      sanitizeForSheets(deletedAt),
    ];

    try {
      await syncService.initializeSheetHeader(token, config.spreadsheetId, sheetName);
      const isFirstSync = !config.lastSync;
      const needsSchemaMigration = settingsService.getSetting(SETTING_KEYS.GOOGLE_SYNC_SCHEMA_VERSION) !== SYNC.SCHEMA_VERSION;

      if (isFirstSync || needsSchemaMigration) {
        return await performFullSync(token, encodedSheetId, sheetName, rowToValues);
      }

      return await performIncrementalSync(token, encodedSheetId, sheetName, ownerKey, config.lastSync!, rowToValues, deletedRowValues);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync failure';
      syncConfigRepository.setGoogleStatus('error');
      settingsService.setGoogleLastError(message);
      throw error;
    }
  },
};

// ── Split sync helpers ────────────────────────────────────────────────────

const finalizeSyncTimestamp = (): string => {
  const at = new Date().toISOString();
  syncConfigRepository.upsertGoogleConfig({
    status: 'active',
    lastSync: at,
  });
  settingsService.setSetting(SETTING_KEYS.GOOGLE_SYNC_SCHEMA_VERSION, SYNC.SCHEMA_VERSION);
  syncDeletionRepository.purgeOldTombstones(90);
  return at;
};

const performFullSync = async (
  token: string,
  encodedSheetId: string,
  sheetName: string,
  rowToValues: (row: SyncRow) => (string | number)[],
): Promise<{ rowsPushed: number; at: string }> => {
  const allRows = transactionService.getRowsForGoogleSync();

  if (allRows.length === 0) {
    // Nothing to write — safe to clear the whole data range in one step.
    const clearResponse = await authorizedFetch(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
        `${sheetName}!A2:I`,
      )}:clear`,
      { method: 'POST' },
    );
    if (!clearResponse.ok) {
      throw new Error(await parseErrorMessage(clearResponse, 'Failed to clear existing sheet data.'));
    }
  } else {
    // Write-first strategy: the sheet always contains *some* data after step 1.
    //
    // Step 1 — overwrite starting at A2 with the full local dataset.
    //   If this fails the sheet is unchanged (old data still visible). ✓
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

    // Step 2 — clear any stale rows that now sit below the new data.
    //   If this fails, the sheet has the correct new data plus stale rows at the
    //   bottom — harmless, and self-healing on the next successful full sync. ✓
    //   Row 1 is the header; rows 2…(allRows.length+1) hold new data;
    //   row (allRows.length+2) onward is where old rows may still linger.
    const staleStart = allRows.length + 2;
    const clearTailResponse = await authorizedFetch(
      token,
      `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
        `${sheetName}!A${staleStart}:I`,
      )}:clear`,
      { method: 'POST' },
    );
    if (!clearTailResponse.ok) {
      throw new Error(await parseErrorMessage(clearTailResponse, 'Failed to clear stale rows from Google Sheet.'));
    }
  }

  const at = finalizeSyncTimestamp();
  return { rowsPushed: allRows.length, at };
};

const performIncrementalSync = async (
  token: string,
  encodedSheetId: string,
  sheetName: string,
  ownerKey: string,
  lastSync: string,
  rowToValues: (row: SyncRow) => (string | number)[],
  deletedRowValues: (id: number, deletedAt: string) => (string | number)[],
): Promise<{ rowsPushed: number; at: string }> => {
  const changedRows = transactionService.getRowsChangedSince(lastSync);
  const deletedRows = transactionService.getDeletedRowsChangedSince(lastSync);

  if (changedRows.length === 0 && deletedRows.length === 0) {
    const at = finalizeSyncTimestamp();
    return { rowsPushed: 0, at };
  }

  const keyToRow = await readSyncKeyColumn(token, encodedSheetId, sheetName);

  const toUpdateActive = changedRows.filter((r) => keyToRow.has(makeSyncKey(ownerKey, r.id)));
  const toAppendActive = changedRows.filter((r) => !keyToRow.has(makeSyncKey(ownerKey, r.id)));
  const toUpdateDeleted = deletedRows.filter((r) => keyToRow.has(makeSyncKey(ownerKey, r.id)));

  await updateExistingRows(token, encodedSheetId, sheetName, ownerKey, toUpdateActive, toUpdateDeleted, keyToRow, rowToValues, deletedRowValues);
  await appendNewRows(token, encodedSheetId, sheetName, toAppendActive, rowToValues);

  const at = finalizeSyncTimestamp();
  return { rowsPushed: changedRows.length + deletedRows.length, at };
};

const readSyncKeyColumn = async (
  token: string,
  encodedSheetId: string,
  sheetName: string,
): Promise<Map<string, number>> => {
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
  const keyToRow = new Map<string, number>();
  (keyColumnData.values ?? []).forEach((cell, index) => {
    if (index === 0) return;
    const key = (cell[0] ?? '').trim();
    if (key) {
      keyToRow.set(key, index + 1);
    }
  });
  return keyToRow;
};

const updateExistingRows = async (
  token: string,
  encodedSheetId: string,
  sheetName: string,
  ownerKey: string,
  toUpdateActive: SyncRow[],
  toUpdateDeleted: Array<{ id: number; deletedAt: string }>,
  keyToRow: Map<string, number>,
  rowToValues: (row: SyncRow) => (string | number)[],
  deletedRowValues: (id: number, deletedAt: string) => (string | number)[],
): Promise<void> => {
  if (toUpdateActive.length === 0 && toUpdateDeleted.length === 0) return;

  const updateData = [
    ...toUpdateActive.map((row) => {
      const syncKey = makeSyncKey(ownerKey, row.id);
      return {
        range: `${sheetName}!A${keyToRow.get(syncKey)}:I${keyToRow.get(syncKey)}`,
        values: [rowToValues(row)],
      };
    }),
    ...toUpdateDeleted.map((row) => {
      const syncKey = makeSyncKey(ownerKey, row.id);
      return {
        range: `${sheetName}!A${keyToRow.get(syncKey)}:I${keyToRow.get(syncKey)}`,
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
};

const appendNewRows = async (
  token: string,
  encodedSheetId: string,
  sheetName: string,
  toAppendActive: SyncRow[],
  rowToValues: (row: SyncRow) => (string | number)[],
): Promise<void> => {
  if (toAppendActive.length === 0) return;

  const appendResponse = await authorizedFetch(
    token,
    `https://sheets.googleapis.com/v4/spreadsheets/${encodedSheetId}/values/${encodeURIComponent(
      `${sheetName}!A:I`,
    )}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      body: JSON.stringify({ values: toAppendActive.map(rowToValues) }),
    },
  );
  if (!appendResponse.ok) {
    throw new Error(await parseErrorMessage(appendResponse, 'Failed to append new transactions to Google Sheet.'));
  }
};
