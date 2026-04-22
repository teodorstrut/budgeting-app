import db from '../connection';

export interface Transaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  categoryId?: number;
  note?: string;
  date: string; // ISO string
  createdAt?: string;
  updatedAt?: string;
}

export const transactionRepository = {
  create: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const result = db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, note, date, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [transaction.amount, transaction.type, transaction.categoryId, transaction.note, transaction.date, now, now]
    );
    return result.lastInsertRowId;
  },

  getAll: (): Transaction[] => {
    const result = db.getAllSync('SELECT * FROM transactions ORDER BY date DESC');
    return result as Transaction[];
  },

  getByDateRange: (startDate: string, endDate: string): Transaction[] => {
    const result = db.getAllSync(
      'SELECT * FROM transactions WHERE substr(date, 1, 10) >= ? AND substr(date, 1, 10) <= ? ORDER BY date DESC',
      [startDate, endDate]
    );
    return result as Transaction[];
  },

  getChangedSince: (sinceIso: string): Transaction[] => {
    const result = db.getAllSync(
      `SELECT * FROM transactions WHERE updatedAt IS NULL OR updatedAt >= ? ORDER BY date DESC`,
      [sinceIso]
    );
    return result as Transaction[];
  },

  getById: (id: number): Transaction | null => {
    const result = db.getFirstSync('SELECT * FROM transactions WHERE id = ?', [id]);
    return result as Transaction | null;
  },

  update: (id: number, transaction: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const fields = [];
    const values = [];
    if (transaction.amount !== undefined) {
      fields.push('amount = ?');
      values.push(transaction.amount);
    }
    if (transaction.type !== undefined) {
      fields.push('type = ?');
      values.push(transaction.type);
    }
    if (transaction.categoryId !== undefined) {
      fields.push('categoryId = ?');
      values.push(transaction.categoryId);
    }
    if (transaction.note !== undefined) {
      fields.push('note = ?');
      values.push(transaction.note);
    }
    if (transaction.date !== undefined) {
      fields.push('date = ?');
      values.push(transaction.date);
    }
    fields.push('updatedAt = ?');
    values.push(new Date().toISOString());
    values.push(id);
    db.runSync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: (id: number) => {
    db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
  },

  /**
   * Returns total expense amount per category for the given date range.
   * Only expense transactions with a categoryId are included.
   * Results are ordered by totalSpent descending.
   */
  getCategoryTotalsForDateRange: (
    startDate: string,
    endDate: string
  ): { categoryId: number; categoryName: string; emoji: string; totalSpent: number }[] => {
    const rows = db.getAllSync(
      `SELECT t.categoryId, c.name AS categoryName, c.emoji,
              SUM(t.amount) AS totalSpent
       FROM transactions t
       JOIN categories c ON c.id = t.categoryId
       WHERE t.type = 'expense'
         AND substr(t.date, 1, 10) >= ?
         AND substr(t.date, 1, 10) <= ?
         AND t.categoryId IS NOT NULL
       GROUP BY t.categoryId
       ORDER BY totalSpent DESC`,
      [startDate, endDate]
    ) as { categoryId: number; categoryName: string; emoji: string | null; totalSpent: number }[];

    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      emoji: r.emoji ?? '💰',
      totalSpent: r.totalSpent,
    }));
  },

  /**
   * Returns the total expense amount for the given date range, optionally filtered by category.
   * Pass null/undefined for categoryId to sum across all categories.
   */
  getExpenseTotalForDateRange: (
    startDate: string,
    endDate: string,
    categoryId?: number | null
  ): number => {
    const row = db.getFirstSync(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE type = 'expense'
         AND substr(date, 1, 10) >= ?
         AND substr(date, 1, 10) <= ?
         AND (? IS NULL OR categoryId = ?)`,
      [startDate, endDate, categoryId ?? null, categoryId ?? null]
    ) as { total: number } | null;

    return row?.total ?? 0;
  },
};