import db from '../database/connection';

export const settingsService = {
  getSetting: (key: string, defaultValue?: string): string | null => {
    const result = db.getFirstSync('SELECT value FROM settings WHERE key = ?', [key]);
    if (!result) {
      return defaultValue ?? null;
    }
    return (result as any).value;
  },

  setSetting: (key: string, value: string): void => {
    const existing = db.getFirstSync('SELECT id FROM settings WHERE key = ?', [key]);
    if (existing) {
      db.runSync('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
    } else {
      db.runSync('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    }
  },

  getNumberSetting: (key: string, defaultValue: number = 0): number => {
    const value = settingsService.getSetting(key);
    return value ? parseInt(value, 10) : defaultValue;
  },

  setNumberSetting: (key: string, value: number): void => {
    settingsService.setSetting(key, value.toString());
  },

  getMonthStartDay: (): number => {
    return settingsService.getNumberSetting('monthStartDay', 1);
  },

  setMonthStartDay: (day: number): void => {
    if (day < 1 || day > 28) {
      throw new Error('Month start day must be between 1 and 28');
    }
    settingsService.setNumberSetting('monthStartDay', day);
  },
};
