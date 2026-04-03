import db from './connection';

// Schema definitions
export const createTables = () => {
  // Users table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      avatar TEXT,
      theme TEXT DEFAULT 'system',
      monthStartDay INTEGER DEFAULT 1
    );
  `);

  // Categories table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emoji TEXT,
      name TEXT NOT NULL,
      type TEXT NOT NULL, -- 'income' or 'expense'
      color TEXT,
      budget REAL DEFAULT 0
    );
  `);

  // Transactions table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'income' or 'expense'
      categoryId INTEGER,
      name TEXT,
      note TEXT,
      date TEXT NOT NULL, -- ISO date string
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories (id)
    );
  `);

  // Budgets table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoryId INTEGER,
      amount REAL NOT NULL,
      period TEXT NOT NULL, -- 'monthly', 'weekly', etc.
      startDate TEXT NOT NULL, -- ISO date string
      FOREIGN KEY (categoryId) REFERENCES categories (id)
    );
  `);

  // Settings table (for app settings)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );
  `);

  // Sync config table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider TEXT NOT NULL, -- 'google'
      spreadsheetId TEXT,
      sheetName TEXT,
      lastSync TEXT, -- ISO date string
      status TEXT DEFAULT 'inactive'
    );
  `);
};

// Initialize database
export const initDatabase = () => {
  createTables();
  // Insert default data if needed
  // For example, default categories
};