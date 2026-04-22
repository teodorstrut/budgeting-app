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
};