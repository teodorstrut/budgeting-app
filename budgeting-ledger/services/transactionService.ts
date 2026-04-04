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


  getSummaryForDateRange: (startDate: string, endDate: string) => {
    const transactions = transactionRepository.getAll().filter(
      t => t.date >= startDate && t.date <= endDate
    );
    let totalIncome = 0;
    let totalExpenses = 0;
    transactions.forEach(t => {
      if (t.type === 'income') {
        totalIncome += t.amount;
      } else if (t.type === 'expense') {
        totalExpenses += t.amount;
      }
    });
    return { totalIncome, totalExpenses, balance: totalIncome - totalExpenses };
  },

  getRecentTransactions: (limit: number = 10) => {
    const transactions = transactionRepository.getAll();
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  },

  getRecentTransactionsForDateRange: (startDate: string, endDate: string, limit: number = 10) => {
    const transactions = transactionRepository.getAll().filter(
      t => t.date >= startDate && t.date <= endDate
    );
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },
};