import { Platform } from 'react-native';

let db: any;

if (Platform.OS === 'web') {
  // Mock db for web – data is NOT persisted.
  db = {
    execSync: (...args: unknown[]) => {
      console.warn('[DB-web] execSync called (no-op):', args);
    },
    runSync: (...args: unknown[]) => {
      console.warn('[DB-web] runSync called (no-op):', args);
      return { lastInsertRowId: 0 };
    },
    getAllSync: (...args: unknown[]) => {
      console.warn('[DB-web] getAllSync called (no-op):', args);
      return [];
    },
    getFirstSync: (...args: unknown[]) => {
      console.warn('[DB-web] getFirstSync called (no-op):', args);
      return null;
    },
  };
} else {
  // @ts-ignore
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('budgeting.db');
  db.execSync('PRAGMA foreign_keys = ON;');
}

export default db;