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

  // Seed default data when database is empty
  const categoryCount = db.getFirstSync('SELECT COUNT(*) AS count FROM categories');
  const categoriesAreEmpty = !categoryCount || categoryCount.count === 0;

  if (categoriesAreEmpty) {
    db.runSync(`INSERT INTO categories (emoji, name, type, color, budget) VALUES (?, ?, ?, ?, ?)`, ['🍎', 'Groceries', 'expense', '#34D399', 500]);
    db.runSync(`INSERT INTO categories (emoji, name, type, color, budget) VALUES (?, ?, ?, ?, ?)`, ['🏠', 'Rent', 'expense', '#60A5FA', 1200]);
    db.runSync(`INSERT INTO categories (emoji, name, type, color, budget) VALUES (?, ?, ?, ?, ?)`, ['💡', 'Utilities', 'expense', '#FBBF24', 250]);
    db.runSync(`INSERT INTO categories (emoji, name, type, color, budget) VALUES (?, ?, ?, ?, ?)`, ['💼', 'Salary', 'income', '#0EA5E9', 0]);
  }

  const transactionCount = db.getFirstSync('SELECT COUNT(*) AS count FROM transactions');
  const transactionsAreEmpty = !transactionCount || transactionCount.count === 0;

  if (transactionsAreEmpty) {
    const groceriesCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Groceries'])?.id;
    const rentCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Rent'])?.id;
    const utilitiesCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Utilities'])?.id;
    const salaryCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Salary'])?.id;

    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, name, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [1500, 'income', salaryCat, 'April paycheck', 'Direct deposit', new Date().toISOString().split('T')[0]]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, name, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [45, 'expense', groceriesCat, 'Weekly groceries', 'Trader Joe\'s', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, name, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [1200, 'expense', rentCat, 'Monthly rent', 'April rent', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, name, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [90, 'expense', utilitiesCat, 'Electricity bill', 'Utility bill due', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, name, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [18, 'expense', groceriesCat, 'Coffee and snacks', 'Starbucks', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );
  }
};