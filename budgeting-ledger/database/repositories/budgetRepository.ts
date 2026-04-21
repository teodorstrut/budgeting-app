import db from '../connection';

export interface Budget {
  id?: number;
  categoryId: number;
  amount: number;
}

export const budgetRepository = {
  upsert: (categoryId: number, amount: number): void => {
    db.runSync(
      `INSERT OR REPLACE INTO budgets (categoryId, amount) VALUES (?, ?)`,
      [categoryId, amount]
    );
  },

  getAll: (): Budget[] => {
    return db.getAllSync('SELECT * FROM budgets') as Budget[];
  },

  getByCategory: (categoryId: number): Budget | null => {
    return db.getFirstSync('SELECT * FROM budgets WHERE categoryId = ?', [categoryId]) as Budget | null;
  },

  delete: (categoryId: number): void => {
    db.runSync('DELETE FROM budgets WHERE categoryId = ?', [categoryId]);
  },

  deleteAll: (): void => {
    db.runSync('DELETE FROM budgets');
  },
};
