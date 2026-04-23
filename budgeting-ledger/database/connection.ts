import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const DB_KEY_STORE_KEY = 'db_encryption_key';

let _db: any = null;

const requireDb = (): any => {
  if (!_db) {
    throw new Error('Database not yet initialized. Ensure initDbConnection() has been called.');
  }
  return _db;
};

/**
 * Forwarding wrapper — preserves the synchronous repository API while allowing
 * async initialization. Repositories import this object and use it exactly as
 * before; calls are forwarded to the real SQLite connection once it is ready.
 */
const db = {
  execSync:    (...args: unknown[]) => requireDb().execSync(...args),
  runSync:     (...args: unknown[]) => requireDb().runSync(...args),
  getAllSync:   (...args: unknown[]) => requireDb().getAllSync(...args),
  getFirstSync: (...args: unknown[]) => requireDb().getFirstSync(...args),
};

if (Platform.OS === 'web') {
  // Mock db for web – data is NOT persisted.
  _db = {
    execSync:    () => {},
    runSync:     () => ({ lastInsertRowId: 0 }),
    getAllSync:   () => [],
    getFirstSync: () => null,
  };
}

/** Generate a 256-bit cryptographically-random key and store it in SecureStore,
 *  or retrieve the one that was already stored. Returns a lower-case hex string. */
const getOrCreateDbKey = async (): Promise<string> => {
  const existing = await SecureStore.getItemAsync(DB_KEY_STORE_KEY);
  if (existing) return existing;

  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  await SecureStore.setItemAsync(DB_KEY_STORE_KEY, key);
  return key;
};

/**
 * Open the SQLite database with an encryption key from SecureStore.
 * Must be called (and awaited) before any repository or schema operation.
 * Safe to call multiple times — subsequent calls are no-ops.
 *
 * Encryption requires expo-sqlite to be built with SQLCipher:
 *   set `["expo-sqlite", { "useSQLCipher": true }]` in the plugins array
 *   of app.json, then run `expo prebuild` and rebuild the native app.
 *
 * Without a SQLCipher build, PRAGMA key is a no-op and data stays unencrypted.
 *
 * Migration note: applying a key to an existing unencrypted database with
 * SQLCipher active will cause read errors. Clear app data (or uninstall/reinstall)
 * to start fresh with encryption enabled.
 */
export const initDbConnection = async (): Promise<void> => {
  if (Platform.OS === 'web' || _db) return;

  // Open the DB synchronously first so _db is never null after this line.
  // The encryption key is applied immediately after — before any table access.
  // @ts-ignore — resolved at runtime by the Expo bare-workflow native build.
  const SQLite = require('expo-sqlite');
  _db = SQLite.openDatabaseSync('budgeting.db');

  try {
    const key = await getOrCreateDbKey();
    // PRAGMA key must be the first command on a SQLCipher connection.
    // On a standard expo-sqlite build (no SQLCipher) this is a silent no-op.
    _db.execSync(`PRAGMA key = "x'${key}'";`);
  } catch (e) {
    // Key retrieval or PRAGMA failed — DB is open but unencrypted.
    // This happens when running in Expo Go or before a SQLCipher native rebuild.
    console.warn('[DB] Encryption setup failed, running unencrypted:', e);
  }

  _db.execSync('PRAGMA foreign_keys = ON;');
};

export default db;