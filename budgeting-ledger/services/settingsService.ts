import * as SecureStore from 'expo-secure-store';
import db from '../database/connection';
import { SECURE_KEYS, SETTING_KEYS } from '../constants/settings';

export const settingsService = {
  getSetting: (key: string, defaultValue?: string): string | null => {
    const result = db.getFirstSync('SELECT value FROM settings WHERE key = ?', [key]);
    if (!result) {
      return defaultValue ?? null;
    }
    return (result as any).value;
  },

  setSetting: (key: string, value: string): void => {
    db.runSync(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      [key, value]
    );
  },

  getNumberSetting: (key: string, defaultValue: number = 0): number => {
    const value = settingsService.getSetting(key);
    if (value == null) return defaultValue;
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  },

  setNumberSetting: (key: string, value: number): void => {
    settingsService.setSetting(key, value.toString());
  },

  getBooleanSetting: (key: string, defaultValue: boolean = false): boolean => {
    return settingsService.getSetting(key, defaultValue ? '1' : '0') === '1';
  },

  setBooleanSetting: (key: string, value: boolean): void => {
    settingsService.setSetting(key, value ? '1' : '0');
  },

  getMonthStartDay: (): number => {
    return settingsService.getNumberSetting(SETTING_KEYS.MONTH_START_DAY, 1);
  },

  setMonthStartDay: (day: number): void => {
    if (day < 1 || day > 28) {
      throw new Error('Month start day must be between 1 and 28');
    }
    settingsService.setNumberSetting(SETTING_KEYS.MONTH_START_DAY, day);
  },

  getGoogleSyncEnabled: (): boolean => {
    return settingsService.getBooleanSetting(SETTING_KEYS.GOOGLE_SYNC_ENABLED);
  },

  setGoogleSyncEnabled: (enabled: boolean): void => {
    settingsService.setBooleanSetting(SETTING_KEYS.GOOGLE_SYNC_ENABLED, enabled);
  },

  getGoogleSpreadsheetName: (): string | null => {
    return settingsService.getSetting(SETTING_KEYS.GOOGLE_SPREADSHEET_NAME);
  },

  setGoogleSpreadsheetName: (name: string): void => {
    settingsService.setSetting(SETTING_KEYS.GOOGLE_SPREADSHEET_NAME, name);
  },

  getGoogleAccountEmail: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(SECURE_KEYS.GOOGLE_ACCOUNT_EMAIL);
  },

  setGoogleAccountEmail: async (email: string): Promise<void> => {
    await SecureStore.setItemAsync(SECURE_KEYS.GOOGLE_ACCOUNT_EMAIL, email);
  },

  getGoogleAccountName: async (): Promise<string | null> => {
    return SecureStore.getItemAsync(SECURE_KEYS.GOOGLE_ACCOUNT_NAME);
  },

  setGoogleAccountName: async (name: string): Promise<void> => {
    await SecureStore.setItemAsync(SECURE_KEYS.GOOGLE_ACCOUNT_NAME, name);
  },

  clearGoogleAccountProfile: async (): Promise<void> => {
    await SecureStore.deleteItemAsync(SECURE_KEYS.GOOGLE_ACCOUNT_EMAIL);
    await SecureStore.deleteItemAsync(SECURE_KEYS.GOOGLE_ACCOUNT_NAME);
  },

  getGoogleLastError: (): string | null => {
    return settingsService.getSetting(SETTING_KEYS.GOOGLE_SYNC_LAST_ERROR);
  },

  getGoogleAutoSyncEnabled: (): boolean => {
    return settingsService.getBooleanSetting(SETTING_KEYS.GOOGLE_AUTO_SYNC_ENABLED, true);
  },

  setGoogleAutoSyncEnabled: (enabled: boolean): void => {
    settingsService.setBooleanSetting(SETTING_KEYS.GOOGLE_AUTO_SYNC_ENABLED, enabled);
  },

  setGoogleLastError: (errorMessage: string): void => {
    settingsService.setSetting(SETTING_KEYS.GOOGLE_SYNC_LAST_ERROR, errorMessage);
  },

  clearGoogleLastError: (): void => {
    settingsService.setSetting(SETTING_KEYS.GOOGLE_SYNC_LAST_ERROR, '');
  },

  getGoogleAutoSyncLastLocalDay: (): string | null => {
    return settingsService.getSetting(SETTING_KEYS.GOOGLE_AUTO_SYNC_LAST_LOCAL_DAY);
  },

  setGoogleAutoSyncLastLocalDay: (localDay: string): void => {
    settingsService.setSetting(SETTING_KEYS.GOOGLE_AUTO_SYNC_LAST_LOCAL_DAY, localDay);
  },

  getGoogleAutoSyncLastRunAt: (): string | null => {
    return settingsService.getSetting(SETTING_KEYS.GOOGLE_AUTO_SYNC_LAST_RUN_AT);
  },

  setGoogleAutoSyncLastRunAt: (isoDate: string): void => {
    settingsService.setSetting(SETTING_KEYS.GOOGLE_AUTO_SYNC_LAST_RUN_AT, isoDate);
  },

  getSyncOwnerKey: (): string | null => {
    return settingsService.getSetting(SETTING_KEYS.GOOGLE_SYNC_OWNER_KEY);
  },

  ensureSyncOwnerKey: (): string => {
    const existing = settingsService.getSyncOwnerKey();
    if (existing) {
      return existing;
    }

    const generated = crypto.randomUUID();
    settingsService.setSetting(SETTING_KEYS.GOOGLE_SYNC_OWNER_KEY, generated);
    return generated;
  },
};
