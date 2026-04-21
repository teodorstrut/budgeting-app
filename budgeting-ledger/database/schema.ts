import db from './connection';

const createSeedTimestamp = (year: number, monthIndex: number, day: number, hour: number, minute: number) =>
  new Date(year, monthIndex, day, hour, minute, 0, 0).toISOString();

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
    const now = new Date();
    const groceriesCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Groceries'])?.id;
    const rentCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Rent'])?.id;
    const utilitiesCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Utilities'])?.id;
    const salaryCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Salary'])?.id;
    const diningOutCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Dining Out'])?.id;
    const transportCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Transport'])?.id;
    const entertainmentCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Entertainment'])?.id;
    const healthCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Health'])?.id;
    const subscriptionsCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Subscriptions'])?.id;
    const freelanceCat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', ['Freelance'])?.id;

    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [
        1500,
        'income',
        salaryCat,
        'Direct deposit',
        createSeedTimestamp(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0),
      ]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [
        45,
        'expense',
        groceriesCat,
        'Trader Joe\'s',
        createSeedTimestamp(now.getFullYear(), now.getMonth(), now.getDate() - 2, 18, 20),
      ]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [
        1200,
        'expense',
        rentCat,
        'April rent',
        createSeedTimestamp(now.getFullYear(), now.getMonth(), now.getDate() - 8, 8, 30),
      ]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [
        90,
        'expense',
        utilitiesCat,
        'Utility bill due',
        createSeedTimestamp(now.getFullYear(), now.getMonth(), now.getDate() - 5, 11, 45),
      ]
    );
    db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
      [
        18,
        'expense',
        groceriesCat,
        'Starbucks',
        createSeedTimestamp(now.getFullYear(), now.getMonth(), now.getDate() - 1, 7, 55),
      ]
    );

    const currentYear = now.getFullYear();
    const marchTransactions = [
      { amount: 62.45, type: 'expense', categoryId: groceriesCat, note: 'Weekly groceries', date: createSeedTimestamp(currentYear, 2, 1, 10, 15) },
      { amount: 14.2, type: 'expense', categoryId: diningOutCat, note: 'Coffee with Alex', date: createSeedTimestamp(currentYear, 2, 2, 8, 40) },
      { amount: 36.8, type: 'expense', categoryId: transportCat, note: 'Fuel refill', date: createSeedTimestamp(currentYear, 2, 3, 17, 25) },
      { amount: 12.99, type: 'expense', categoryId: subscriptionsCat, note: 'Music subscription', date: createSeedTimestamp(currentYear, 2, 4, 6, 30) },
      { amount: 420, type: 'income', categoryId: freelanceCat, note: 'Freelance logo project', date: createSeedTimestamp(currentYear, 2, 5, 14, 10) },
      { amount: 89.1, type: 'expense', categoryId: groceriesCat, note: 'Bulk pantry shop', date: createSeedTimestamp(currentYear, 2, 6, 16, 50) },
      { amount: 24, type: 'expense', categoryId: transportCat, note: 'Ride share', date: createSeedTimestamp(currentYear, 2, 7, 21, 5) },
      { amount: 48.5, type: 'expense', categoryId: diningOutCat, note: 'Dinner downtown', date: createSeedTimestamp(currentYear, 2, 8, 19, 35) },
      { amount: 19.99, type: 'expense', categoryId: entertainmentCat, note: 'Movie tickets', date: createSeedTimestamp(currentYear, 2, 10, 20, 0) },
      { amount: 33.25, type: 'expense', categoryId: healthCat, note: 'Pharmacy essentials', date: createSeedTimestamp(currentYear, 2, 11, 12, 20) },
      { amount: 76.9, type: 'expense', categoryId: groceriesCat, note: 'Farmer market', date: createSeedTimestamp(currentYear, 2, 12, 9, 45) },
      { amount: 1350, type: 'income', categoryId: salaryCat, note: 'Mid-month salary', date: createSeedTimestamp(currentYear, 2, 14, 9, 5) },
      { amount: 58.75, type: 'expense', categoryId: utilitiesCat, note: 'Internet and power', date: createSeedTimestamp(currentYear, 2, 15, 13, 15) },
      { amount: 16.4, type: 'expense', categoryId: diningOutCat, note: 'Lunch break', date: createSeedTimestamp(currentYear, 2, 17, 12, 5) },
      { amount: 71.2, type: 'expense', categoryId: groceriesCat, note: 'Grocery top-up', date: createSeedTimestamp(currentYear, 2, 18, 18, 10) },
      { amount: 27.5, type: 'expense', categoryId: transportCat, note: 'Bus pass', date: createSeedTimestamp(currentYear, 2, 20, 7, 45) },
      { amount: 260, type: 'income', categoryId: freelanceCat, note: 'Website maintenance', date: createSeedTimestamp(currentYear, 2, 22, 15, 30) },
      { amount: 44.6, type: 'expense', categoryId: entertainmentCat, note: 'Concert ticket', date: createSeedTimestamp(currentYear, 2, 24, 20, 25) },
      { amount: 52.3, type: 'expense', categoryId: groceriesCat, note: 'Weekend groceries', date: createSeedTimestamp(currentYear, 2, 26, 11, 0) },
      { amount: 95, type: 'expense', categoryId: utilitiesCat, note: 'Water and gas bill', date: createSeedTimestamp(currentYear, 2, 29, 9, 50) },
    ] as const;

    marchTransactions.forEach((transaction) => {
      db.runSync(
        `INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`,
        [transaction.amount, transaction.type, transaction.categoryId, transaction.note, transaction.date]
      );
    });
  }

  // Seed budgets if none exist
  const budgetCount = db.getFirstSync('SELECT COUNT(*) AS count FROM budgets') as { count: number } | null;
  if (!budgetCount || budgetCount.count === 0) {
    const budgetCategories = [
      { name: 'Groceries',    amount: 400 },
      { name: 'Dining Out',   amount: 300 },
      { name: 'Transport',    amount: 200 },
      { name: 'Subscriptions', amount: 100 },
      { name: 'Entertainment', amount: 150 },
    ];
    budgetCategories.forEach(({ name, amount }) => {
      const cat = db.getFirstSync('SELECT id FROM categories WHERE name = ?', [name]) as { id: number } | null;
      if (cat?.id) {
        db.runSync(`INSERT OR REPLACE INTO budgets (categoryId, amount) VALUES (?, ?)`, [cat.id, amount]);
      }
    });
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
  db.execSync('DELETE FROM sync_deletions;');
  db.execSync('DELETE FROM sqlite_sequence WHERE name = "transactions" OR name = "categories";');
  seedData();
};