import { Platform } from 'react-native';

let db: any;

if (Platform.OS === 'web') {
  // Mock db for web
  db = {
    execSync: () => {},
    runSync: () => ({ lastInsertRowId: 0 }),
    getAllSync: () => [],
    getFirstSync: () => null,
  };
} else {
  // @ts-ignore
  const SQLite = require('expo-sqlite');
  db = SQLite.openDatabaseSync('budgeting.db');
}

export default db;