import { transactionRepository, Transaction } from '../database/repositories/transactionRepository';
import { categoryRepository } from '../database/repositories/categoryRepository';
import { syncDeletionRepository } from '../database/repositories/syncDeletionRepository';
import { settingsService } from './settingsService';
import { monthUtils } from '../utils/monthUtils';
import { SyncRow } from '../types/sync';

const toIsoDate = (raw: string | undefined): string => {
  if (!raw) return new Date(0).toISOString();
  return raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`;
};

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
    syncDeletionRepository.recordTransactionDeletion(id, new Date().toISOString());
    transactionRepository.delete(id);
  },

  getSummaryForDateRange: (startDate: string, endDate: string) => {
    const transactions = transactionRepository.getAll().filter(
      t => t.date.slice(0, 10) >= startDate && t.date.slice(0, 10) <= endDate
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

  /**
   * Get summary for the current month period based on monthStartDay setting
   */
  getCurrentMonthSummary: () => {
    const monthStartDay = settingsService.getMonthStartDay();
    const monthStart = monthUtils.getCurrentMonthStart(monthStartDay);
    const monthEnd = monthUtils.getCurrentMonthEnd(monthStartDay);
    return transactionService.getSummaryForDateRange(monthStart, monthEnd);
  },

  /**
   * Get transactions for the current month period based on monthStartDay setting
   */
  getTransactionsForCurrentMonth: (limit?: number) => {
    const monthStartDay = settingsService.getMonthStartDay();
    const monthStart = monthUtils.getCurrentMonthStart(monthStartDay);
    const monthEnd = monthUtils.getCurrentMonthEnd(monthStartDay);

    const transactions = transactionRepository.getAll().filter(
      t => t.date.slice(0, 10) >= monthStart && t.date.slice(0, 10) <= monthEnd
    );
    
    const sorted = transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return limit ? sorted.slice(0, limit) : sorted;
  },

  /**
   * Get all monthly summaries for a given date range, respecting monthStartDay
   */
  getMonthlySummaries: (startDate: string, endDate: string) => {
    const monthStartDay = settingsService.getMonthStartDay();
    const periods = monthUtils.getMonthPeriods(monthStartDay, startDate, endDate);
    
    return periods.map(([periodStart, periodEnd]) => ({
      startDate: periodStart,
      endDate: periodEnd,
      summary: transactionService.getSummaryForDateRange(periodStart, periodEnd),
    }));
  },

  getRecentTransactions: (limit: number = 10) => {
    const transactions = transactionRepository.getAll();
    return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, limit);
  },

  getRecentTransactionsForDateRange: (startDate: string, endDate: string, limit: number = 10) => {
    const transactions = transactionRepository.getAll().filter(
      t => t.date.slice(0, 10) >= startDate && t.date.slice(0, 10) <= endDate
    );
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  },

  getRowsForGoogleSync: (): SyncRow[] => {
    const categoriesById = new Map(
      categoryRepository.getAll().map((category) => [category.id, category])
    );

    return transactionRepository.getAll().map((transaction) => {
      const category = transaction.categoryId != null ? categoriesById.get(transaction.categoryId) : undefined;
      const categoryText = [category?.emoji ?? '', category?.name ?? 'Uncategorized']
        .join(' ')
        .trim();

      const updatedAt = toIsoDate(transaction.updatedAt);

      return {
        id: transaction.id!,
        name: transaction.note?.trim() || 'Untitled transaction',
        type: transaction.type,
        category: categoryText,
        amount: transaction.amount,
        datetime: transaction.date,
        updatedAt,
      };
    });
  },

  getRowsChangedSince: (lastSync: string): SyncRow[] => {
    const lastSyncDate = new Date(lastSync);
    const categoriesById = new Map(
      categoryRepository.getAll().map((category) => [category.id, category])
    );

    return transactionRepository.getAll()
      .filter((transaction) => {
        if (!transaction.updatedAt) return true;
        return new Date(toIsoDate(transaction.updatedAt)) > lastSyncDate;
      })
      .map((transaction) => {
        const category = transaction.categoryId != null ? categoriesById.get(transaction.categoryId) : undefined;
        const categoryText = [category?.emoji ?? '', category?.name ?? 'Uncategorized']
          .join(' ')
          .trim();

        const updatedAt = toIsoDate(transaction.updatedAt);

        return {
          id: transaction.id!,
          name: transaction.note?.trim() || 'Untitled transaction',
          type: transaction.type,
          category: categoryText,
          amount: transaction.amount,
          datetime: transaction.date,
          updatedAt,
        };
      });
  },

  getDeletedRowsChangedSince: (lastSync: string): Array<{ id: number; deletedAt: string }> => {
    const lastSyncDate = new Date(lastSync);

    return syncDeletionRepository
      .getDeletedSince(lastSync)
      .filter((row) => new Date(toIsoDate(row.deletedAt)) > lastSyncDate)
      .map((row) => ({
        id: row.transactionId,
        deletedAt: toIsoDate(row.deletedAt),
      }));
  },
};