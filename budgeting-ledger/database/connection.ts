import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('budgeting.db');

export default db;