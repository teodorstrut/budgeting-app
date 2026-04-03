import db from './connection';

export interface Transaction {
  id?: number;
  amount: number;
  type: 'income' | 'expense';
  categoryId?: number;
  name?: string;
  note?: string;
  date: string; // ISO string
  createdAt?: string;
  updatedAt?: string;
}

export const transactionRepository = {
  create: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = db.runSync(
      `INSERT INTO transactions (amount, type, categoryId, name, note, date) VALUES (?, ?, ?, ?, ?, ?)`,
      [transaction.amount, transaction.type, transaction.categoryId, transaction.name, transaction.note, transaction.date]
    );
    return result.lastInsertRowId;
  },

  getAll: (): Transaction[] => {
    const result = db.getAllSync('SELECT * FROM transactions ORDER BY date DESC');
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
    if (transaction.name !== undefined) {
      fields.push('name = ?');
      values.push(transaction.name);
    }
    if (transaction.note !== undefined) {
      fields.push('note = ?');
      values.push(transaction.note);
    }
    if (transaction.date !== undefined) {
      fields.push('date = ?');
      values.push(transaction.date);
    }
    fields.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(id);
    db.runSync(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
  },

  delete: (id: number) => {
    db.runSync('DELETE FROM transactions WHERE id = ?', [id]);
  },
};