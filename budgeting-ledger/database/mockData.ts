import db from './connection';

type CategorySeed = { emoji: string; name: string; type: 'income' | 'expense' };

const EXPENSE_CATEGORIES: CategorySeed[] = [
  { emoji: '🍎', name: 'Groceries', type: 'expense' },
  { emoji: '🏠', name: 'Rent', type: 'expense' },
  { emoji: '💡', name: 'Utilities', type: 'expense' },
  { emoji: '🍽️', name: 'Dining Out', type: 'expense' },
  { emoji: '🚗', name: 'Transport', type: 'expense' },
  { emoji: '⛽', name: 'Fuel', type: 'expense' },
  { emoji: '🏥', name: 'Healthcare', type: 'expense' },
  { emoji: '💊', name: 'Pharmacy', type: 'expense' },
  { emoji: '📱', name: 'Phone Bill', type: 'expense' },
  { emoji: '🌐', name: 'Internet', type: 'expense' },
  { emoji: '🎬', name: 'Entertainment', type: 'expense' },
  { emoji: '👕', name: 'Clothing', type: 'expense' },
  { emoji: '🏋️', name: 'Gym', type: 'expense' },
  { emoji: '📚', name: 'Education', type: 'expense' },
  { emoji: '🐶', name: 'Pet Care', type: 'expense' },
  { emoji: '🎁', name: 'Gifts', type: 'expense' },
  { emoji: '✈️', name: 'Travel', type: 'expense' },
  { emoji: '🧴', name: 'Personal Care', type: 'expense' },
  { emoji: '🛠️', name: 'Home Maintenance', type: 'expense' },
  { emoji: '📦', name: 'Subscriptions', type: 'expense' },
];

const INCOME_CATEGORIES: CategorySeed[] = [
  { emoji: '💼', name: 'Salary', type: 'income' },
  { emoji: '💻', name: 'Freelance', type: 'income' },
  { emoji: '📈', name: 'Investments', type: 'income' },
  { emoji: '🎉', name: 'Gifts Received', type: 'income' },
  { emoji: '💸', name: 'Refunds', type: 'income' },
];

// Realistic per-category amount ranges, [min, max].
const EXPENSE_AMOUNT_RANGES: Record<string, [number, number]> = {
  Groceries: [15, 120],
  Rent: [850, 950],
  Utilities: [40, 180],
  'Dining Out': [10, 70],
  Transport: [5, 40],
  Fuel: [30, 80],
  Healthcare: [20, 250],
  Pharmacy: [5, 60],
  'Phone Bill': [20, 45],
  Internet: [30, 60],
  Entertainment: [10, 60],
  Clothing: [20, 150],
  Gym: [25, 60],
  Education: [15, 200],
  'Pet Care': [10, 90],
  Gifts: [10, 100],
  Travel: [50, 600],
  'Personal Care': [10, 70],
  'Home Maintenance': [20, 300],
  Subscriptions: [5, 25],
};

const INCOME_AMOUNT_RANGES: Record<string, [number, number]> = {
  Salary: [1800, 2600],
  Freelance: [150, 900],
  Investments: [20, 400],
  'Gifts Received': [20, 200],
  Refunds: [10, 150],
};

const EXPENSE_NOTES: Record<string, string[]> = {
  Groceries: ["Trader Joe's run", 'Whole Foods', 'Local supermarket', 'Costco stock-up', 'Corner store'],
  Rent: ['Monthly rent', 'Rent payment', 'Landlord transfer'],
  Utilities: ['Electric bill', 'Water bill', 'Gas bill', 'Utility payment'],
  'Dining Out': ['Dinner with friends', 'Sushi night', 'Brunch', 'Coffee shop', 'Pizza order', 'Fast food'],
  Transport: ['Uber ride', 'Bus pass', 'Train ticket', 'Parking fee', 'Toll'],
  Fuel: ['Gas station fill-up', 'Shell station', 'Diesel top-up'],
  Healthcare: ['Doctor visit', 'Dental checkup', 'Eye exam', 'Specialist appointment'],
  Pharmacy: ['Prescription refill', 'Pharmacy run', 'Over-the-counter meds'],
  'Phone Bill': ['Mobile carrier bill', 'Phone plan payment'],
  Internet: ['ISP bill', 'Broadband payment'],
  Entertainment: ['Movie tickets', 'Concert tickets', 'Streaming rental', 'Arcade night', 'Bowling'],
  Clothing: ['New shoes', 'Clothing haul', 'Jacket purchase', 'Online clothing order'],
  Gym: ['Gym membership', 'Fitness class', 'Personal training session'],
  Education: ['Online course', 'Textbooks', 'Tuition payment', 'Workshop fee'],
  'Pet Care': ['Vet visit', 'Pet food', 'Grooming appointment', 'Pet supplies'],
  Gifts: ['Birthday gift', 'Holiday gift', 'Wedding gift', 'Gift wrap & card'],
  Travel: ['Flight booking', 'Hotel stay', 'Airbnb', 'Car rental', 'Travel insurance'],
  'Personal Care': ['Haircut', 'Skincare products', 'Spa visit', 'Salon appointment'],
  'Home Maintenance': ['Plumber visit', 'Appliance repair', 'Hardware store run', 'Cleaning service'],
  Subscriptions: ['Netflix', 'Spotify', 'Cloud storage', 'News subscription', 'App subscription'],
};

const INCOME_NOTES: Record<string, string[]> = {
  Salary: ['Monthly salary'],
  Freelance: ['Client project payment', 'Freelance invoice', 'Contract work payout'],
  Investments: ['Dividend payout', 'Stock sale', 'Interest income'],
  'Gifts Received': ['Birthday gift money', 'Holiday gift', 'Cash gift'],
  Refunds: ['Store refund', 'Overpayment refund', 'Return refund'],
};

// Monthly budget targets for a realistic subset of expense categories.
const BUDGETS: Record<string, number> = {
  Groceries: 400,
  Rent: 900,
  Utilities: 150,
  'Dining Out': 150,
  Transport: 100,
  Fuel: 120,
  Healthcare: 100,
  'Phone Bill': 40,
  Internet: 50,
  Entertainment: 80,
  Clothing: 100,
  Gym: 50,
  'Pet Care': 60,
  Subscriptions: 30,
  Travel: 200,
};

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;
const pick = <T,>(arr: T[]): T => arr[randomInt(0, arr.length - 1)];
const round2 = (value: number) => Math.round(value * 100) / 100;

/** Random ISO datetime somewhere within calendar month `monthsAgo` (0 = current month, capped at "now"). */
const randomDateInMonth = (monthsAgo: number): string => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
  const end = monthsAgo === 0 ? now : new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59);
  const time = start.getTime() + Math.random() * Math.max(0, end.getTime() - start.getTime());
  return new Date(time).toISOString();
};

const insertCategory = (cat: CategorySeed): number => {
  const result = db.runSync(`INSERT INTO categories (emoji, name, type) VALUES (?, ?, ?)`, [cat.emoji, cat.name, cat.type]);
  return result.lastInsertRowId;
};

const insertTransaction = (amount: number, type: 'income' | 'expense', categoryId: number, note: string, date: string) => {
  db.runSync(`INSERT INTO transactions (amount, type, categoryId, note, date) VALUES (?, ?, ?, ?, ?)`, [amount, type, categoryId, note, date]);
};

// Dev-only sample data generator. Guarded at the call site (Settings screen, __DEV__-gated
// button) and again here, so this can never run against a release/production JS bundle.
export const seedMockData = (): { categories: number; transactions: number; budgets: number } => {
  if (!__DEV__) {
    throw new Error('seedMockData is dev-only and must not run in a production build.');
  }

  db.execSync('DELETE FROM budgets;');
  db.execSync('DELETE FROM sync_deletions;');
  db.execSync('DELETE FROM transactions;');
  db.execSync('DELETE FROM categories;');
  db.execSync(`DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'categories', 'budgets');`);

  const expenseCats = EXPENSE_CATEGORIES.map((cat) => ({ id: insertCategory(cat), name: cat.name }));
  const incomeCats = INCOME_CATEGORIES.map((cat) => ({ id: insertCategory(cat), name: cat.name }));

  let budgetCount = 0;
  expenseCats.forEach((cat) => {
    const amount = BUDGETS[cat.name];
    if (amount != null) {
      db.runSync(`INSERT INTO budgets (categoryId, amount) VALUES (?, ?)`, [cat.id, amount]);
      budgetCount += 1;
    }
  });

  const salaryCat = incomeCats.find((c) => c.name === 'Salary')!;
  const otherIncomeCats = incomeCats.filter((c) => c.name !== 'Salary');

  let transactionCount = 0;

  for (let monthsAgo = 0; monthsAgo < 6; monthsAgo++) {
    const monthCount = randomInt(20, 40);

    // One guaranteed Salary payment this month.
    const [salaryMin, salaryMax] = INCOME_AMOUNT_RANGES.Salary;
    insertTransaction(round2(randomFloat(salaryMin, salaryMax)), 'income', salaryCat.id, pick(INCOME_NOTES.Salary), randomDateInMonth(monthsAgo));

    const remaining = monthCount - 1;
    const extraIncomeCount = Math.min(remaining, randomInt(1, 3));
    const expenseCount = remaining - extraIncomeCount;

    for (let i = 0; i < extraIncomeCount; i++) {
      const cat = pick(otherIncomeCats);
      const [min, max] = INCOME_AMOUNT_RANGES[cat.name];
      insertTransaction(round2(randomFloat(min, max)), 'income', cat.id, pick(INCOME_NOTES[cat.name]), randomDateInMonth(monthsAgo));
    }

    for (let i = 0; i < expenseCount; i++) {
      const cat = pick(expenseCats);
      const [min, max] = EXPENSE_AMOUNT_RANGES[cat.name];
      insertTransaction(round2(randomFloat(min, max)), 'expense', cat.id, pick(EXPENSE_NOTES[cat.name]), randomDateInMonth(monthsAgo));
    }

    transactionCount += monthCount;
  }

  return {
    categories: expenseCats.length + incomeCats.length,
    transactions: transactionCount,
    budgets: budgetCount,
  };
};
