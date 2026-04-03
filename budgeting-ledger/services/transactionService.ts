import { transactionRepository, Transaction } from '../database/repositories/transactionRepository';

export const transactionService = {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    return transactionRepository.create(transaction);
  },

  getTransactions: () => {
    return transactionRepository.getAll();
  },

  updateTransaction: (id: number, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => {
    transactionRepository.update(id, updates);
  },

  deleteTransaction: (id: number) => {
    transactionRepository.delete(id);
  },

  getTransactionsByCategory: (categoryId: number) => {
    // For now, filter in memory
    const all = transactionRepository.getAll();
    return all.filter(t => t.categoryId === categoryId);
  },

  getTransactionsByDateRange: (startDate: string, endDate: string) => {
    const all = transactionRepository.getAll();
    return all.filter(t => t.date >= startDate && t.date <= endDate);
  },

  getSummary: () => {
    const transactions = transactionRepository.getAll();
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpenses += t.amount;
      }
    });
    const balance = totalIncome - totalExpenses;
    return { totalIncome, totalExpenses, balance };
  },

  getRecentTransactions: (limit: number = 10) => {
    const transactions = transactionRepository.getAll();
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  },
};