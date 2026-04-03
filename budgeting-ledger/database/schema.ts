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
      type TEXT NOT NULL -- 'income' or 'expense'
    );
  `);

  // Transactions table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      amount REAL NOT NULL,
      type TEXT NOT NULL, -- 'income' or 'expense'
      categoryId INTEGER,
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

const seedData = () => {
  const categoryCount = db.getFirstSync('SELECT COUNT(*) AS count FROM categories');
  const categoriesAreEmpty = !categoryCount || categoryCount.count === 0;

  if (categoriesAreEmpty) {
    // Expense categories
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🍎', 'Groceries', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🏠', 'Rent', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['💡', 'Utilities', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🍽️', 'Dining Out', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🚗', 'Transport', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🎬', 'Entertainment', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['💊', 'Health', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🏋️', 'Fitness', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['👕', 'Clothing', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['💇', 'Personal Care', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['📚', 'Education', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['✈️', 'Travel', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🛡️', 'Insurance', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['📱', 'Subscriptions', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🔧', 'Home Maintenance', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['⛽', 'Fuel', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🐾', 'Pets', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🎁', 'Gifts', 'expense']);
    // Income categories
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['💼', 'Salary', 'income']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['💻', 'Freelance', 'income']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['📈', 'Investments', 'income']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🎁', 'Gifts Received', 'income']);
  }

  const transactionCount = db.getFirstSync('SELECT COUNT(*) AS count FROM transactions');
  const transactionsAreEmpty = !transactionCount || transactionCount.count === 0;

  if (transactionsAreEmpty) {
    const groceriesCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Groceries'])?.id;
    const rentCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Rent'])?.id;
    const utilitiesCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Utilities'])?.id;
    const salaryCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Salary'])?.id;

    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [1500, 'income', salaryCat, 'Direct deposit', new Date().toISOString().split('T')[0]]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [45, 'expense', groceriesCat, 'Trader Joe\'s', new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [1200, 'expense', rentCat, 'April rent', new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [90, 'expense', utilitiesCat, 'Utility bill due', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [18, 'expense', groceriesCat, 'Starbucks', new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]]
    );
  }
};

// Initialize database
export const initDatabase = () => {
  createTables();
  seedData();
};

// Clear all data and re-seed (for dev/reset purposes)
export const resetAndReseed = () => {
  db.execSync('DELETE FROM transactions;');
  db.execSync('DELETE FROM categories;');
  db.execSync('DELETE FROM sqlite_sequence WHERE name = "transactions" OR name = "categories";');
  seedData();
};