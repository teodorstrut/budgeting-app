import db from './connection';

// Schema definitions
export const createTables = () => {
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
      amount REAL NOT NULL CHECK (amount >= 0),
      type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
      categoryId INTEGER,
      note TEXT,
      date TEXT NOT NULL, -- ISO date string
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (categoryId) REFERENCES categories (id)
    );
  `);

  // Indexes for common query patterns
  db.execSync('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);');
  db.execSync('CREATE INDEX IF NOT EXISTS idx_transactions_categoryId ON transactions(categoryId);');
  db.execSync('CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);');

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

  // Sync deletions table keeps tombstones for incremental remote delete propagation
  db.execSync(`
    CREATE TABLE IF NOT EXISTS sync_deletions (
      transactionId INTEGER PRIMARY KEY,
      deletedAt TEXT NOT NULL
    );
  `);

  // Budgets table — one budget per expense category.
  // Drop and recreate if the schema has changed (e.g. old table had a 'period' column).
  const budgetsColumns = db.getAllSync(`PRAGMA table_info(budgets)`) as Array<{ name: string }>;
  const hasLegacyPeriodColumn = budgetsColumns.some((col) => col.name === 'period');
  if (hasLegacyPeriodColumn) {
    db.execSync(`DROP TABLE IF EXISTS budgets;`);
  }
  db.execSync(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      categoryId INTEGER NOT NULL UNIQUE,
      amount REAL NOT NULL CHECK (amount >= 0),
      FOREIGN KEY (categoryId) REFERENCES categories(id)
    );
  `);
};

const seedData = () => {
  const categoryCount = db.getFirstSync('SELECT COUNT(*) AS count FROM categories');
  const categoriesAreEmpty = !categoryCount || categoryCount.count === 0;

  if (categoriesAreEmpty) {
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🍎', 'Groceries', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🏠', 'Rent', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['💡', 'Utilities', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🍽️', 'Dining Out', 'expense']);
    db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, ['🚗', 'Transport', 'expense']);
  }
};

// Initialize database
export const initDatabase = () => {
  createTables();
  seedData();
};

// Clear all data and re-seed (for dev/reset purposes)
export const resetAndReseed = () => {
  // Delete in FK-safe order: budgets and sync_deletions before their referenced tables
  db.execSync('DELETE FROM budgets;');
  db.execSync('DELETE FROM sync_deletions;');
  db.execSync('DELETE FROM transactions;');
  db.execSync('DELETE FROM categories;');
  db.execSync(`DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'categories', 'budgets');`);
  seedData();
};