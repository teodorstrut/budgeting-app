import { transactionRepository, Transaction } from '../database/repositories/transactionRepository';
import { categoryRepository } from '../database/repositories/categoryRepository';
import { syncDeletionRepository } from '../database/repositories/syncDeletionRepository';
import { settingsService } from './settingsService';
import { monthUtils } from '../utils/monthUtils';
import { SyncRow } from '../types/sync';
import db from '../database/connection';

const toIsoDate = (raw: string | undefined): string => {
  if (!raw) return '';
  return raw.includes('T') ? raw : `${raw.replace(' ', 'T')}Z`;
};

const getCategoryMap = () =>
  new Map(categoryRepository.getAll().map((category) => [category.id, category]));

const validateTransaction = (transaction: { amount: number; type: string; date: string; categoryId?: number }) => {
  if (typeof transaction.amount !== 'number' || transaction.amount <= 0 || !Number.isFinite(transaction.amount)) {
    throw new Error('Amount must be a positive number.');
  }
  if (transaction.type !== 'income' && transaction.type !== 'expense') {
    throw new Error("Type must be 'income' or 'expense'.");
  }
  if (!transaction.date || Number.isNaN(new Date(transaction.date).getTime())) {
    throw new Error('Date must be a valid ISO string.');
  }
  if (transaction.categoryId != null) {
    const category = categoryRepository.getById(transaction.categoryId);
    if (!category) {
      throw new Error(`Category with id ${transaction.categoryId} does not exist.`);
    }
  }
};

export const transactionService = {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    validateTransaction(transaction);
    return transactionRepository.create(transaction);
  },

  getTransactions: () => {
    return transactionRepository.getAll();
  },

  updateTransaction: (id: number, updates: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const existing = transactionRepository.getById(id);
    if (!existing) {
      throw new Error(`Transaction with id ${id} does not exist.`);
    }
    validateTransaction({ ...existing, ...updates });
    transactionRepository.update(id, updates);
  },

  deleteTransaction: (id: number) => {
    db.execSync('BEGIN TRANSACTION');
    try {
      syncDeletionRepository.recordTransactionDeletion(id, new Date().toISOString());
      transactionRepository.delete(id);
      db.execSync('COMMIT');
    } catch (error) {
      db.execSync('ROLLBACK');
      throw error;
    }
  },

  getSummaryForDateRange: (startDate: string, endDate: string) => {
    const transactions = transactionRepository.getByDateRange(startDate, endDate);
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

    const transactions = transactionRepository.getByDateRange(monthStart, monthEnd);
    
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
    return transactions.slice(0, limit);
  },

  getRecentTransactionsForDateRange: (startDate: string, endDate: string, limit: number = 10) => {
    const transactions = transactionRepository.getByDateRange(startDate, endDate);
    return transactions.slice(0, limit);
  },

  getRowsForGoogleSync: (): SyncRow[] => {
    const categoriesById = getCategoryMap();

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
    const categoriesById = getCategoryMap();

    return transactionRepository.getChangedSince(lastSync)
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
    return syncDeletionRepository
      .getDeletedSince(lastSync)
      .map((row) => ({
        id: row.transactionId,
        deletedAt: toIsoDate(row.deletedAt) || row.deletedAt,
      }));
  },

  /**
   * Returns total expense amount per category for the given date range.
   */
  getCategorySpendingForMonth: (
    startDate: string,
    endDate: string,
    type: 'expense' | 'income' = 'expense'
  ): { categoryId: number; categoryName: string; emoji: string; totalSpent: number }[] => {
    return transactionRepository.getCategoryTotalsForDateRange(startDate, endDate, type);
  },

  /**
   * Returns per-period total expense amounts for use in a spending evolution chart.
   * Pass categoryId to filter by a single category, or null/undefined for all.
   */
  getSpendingEvolutionForPeriods: (
    periods: { start: string; end: string }[],
    categoryId?: number | null
  ): { start: string; end: string; total: number }[] => {
    return periods.map(({ start, end }) => ({
      start,
      end,
      total: transactionRepository.getExpenseTotalForDateRange(start, end, categoryId),
    }));
  },
};