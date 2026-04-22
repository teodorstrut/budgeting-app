import { budgetRepository } from '../database/repositories/budgetRepository';
import { categoryRepository } from '../database/repositories/categoryRepository';
import { transactionService } from './transactionService';
import db from '../database/connection';

export interface BudgetEntry {
  categoryId: number;
  categoryName: string;
  emoji: string;
  amount: number;
}

export interface BudgetHealthEntry extends BudgetEntry {
  spent: number;
  /** spent - amount: positive means over-budget, negative means under */
  delta: number;
}

export const budgetService = {
  /**
   * Returns all configured budgets enriched with category name and emoji.
   */
  getBudgetsWithCategories: (): BudgetEntry[] => {
    const budgets = budgetRepository.getAll();
    return budgets
      .map((b) => {
        const cat = categoryRepository.getById(b.categoryId);
        if (!cat) return null;
        return {
          categoryId: b.categoryId,
          categoryName: cat.name,
          emoji: cat.emoji ?? '💰',
          amount: b.amount,
        } satisfies BudgetEntry;
      })
      .filter((e): e is BudgetEntry => e !== null);
  },

  /**
   * Atomically replaces all budgets.
   * Items with amount <= 0 are skipped (treated as removed).
   */
  saveBudgets: (items: { categoryId: number; amount: number }[]): void => {
    budgetRepository.deleteAll();
    for (const item of items) {
      if (item.amount > 0) {
        budgetRepository.upsert(item.categoryId, item.amount);
      }
    }
  },

  /**
   * Returns how every budgeted expense category is doing vs. actual spending
   * in the given date range. Only categories that have a budget are included.
   * Results are sorted: most over-budget (or closest to blowing budget) first.
   */
  getBudgetHealthData: (start: string, end: string): BudgetHealthEntry[] => {
    const rows = db.getAllSync(
      `SELECT b.categoryId, b.amount, c.name AS categoryName, c.emoji,
              COALESCE(SUM(t.amount), 0) AS spent
       FROM budgets b
       JOIN categories c ON c.id = b.categoryId
       LEFT JOIN transactions t
         ON t.categoryId = b.categoryId
         AND t.type = 'expense'
         AND t.date >= ?
         AND t.date <= ?
       GROUP BY b.categoryId`,
      [start, end]
    ) as Array<{
      categoryId: number;
      amount: number;
      categoryName: string;
      emoji: string | null;
      spent: number;
    }>;

    const entries: BudgetHealthEntry[] = rows
      .filter((r) => r.spent > 0)
      .map((r) => ({
        categoryId: r.categoryId,
        categoryName: r.categoryName,
        emoji: r.emoji ?? '💰',
        amount: r.amount,
        spent: r.spent,
        delta: r.spent - r.amount,
      }));

    // Sort: closest to (or over) budget limit first (ratio desc), then by biggest spend desc
    entries.sort((a, b) => {
      const ratioA = a.amount > 0 ? a.spent / a.amount : 0;
      const ratioB = b.amount > 0 ? b.spent / b.amount : 0;
      if (ratioB !== ratioA) return ratioB - ratioA;
      return b.spent - a.spent;
    });

    return entries;
  },

  /** Returns true when at least one budget row exists. */
  hasBudgets: (): boolean => {
    const result = db.getFirstSync('SELECT COUNT(*) AS count FROM budgets') as { count: number } | null;
    return (result?.count ?? 0) > 0;
  },

  /**
   * Returns all expense categories with their spending for the date range.
   * Budgeted categories come first, sorted by spent/budget ratio descending.
   * Non-budgeted categories follow, sorted by totalSpent descending.
   * budget is null for non-budgeted categories.
   */
  getAllCategoryBudgetData: (
    start: string,
    end: string
  ): { categoryId: number; categoryName: string; emoji: string; spent: number; budget: number | null }[] => {
    const budgeted = budgetService.getBudgetHealthData(start, end);
    const budgetedIds = new Set(budgeted.map((e) => e.categoryId));

    const allSpending = transactionService.getCategorySpendingForMonth(start, end);
    const nonBudgeted = allSpending
      .filter((s) => !budgetedIds.has(s.categoryId))
      .map((s) => ({
        categoryId: s.categoryId,
        categoryName: s.categoryName,
        emoji: s.emoji,
        spent: s.totalSpent,
        budget: null as number | null,
      }));

    const budgetedMapped = budgeted.map((e) => ({
      categoryId: e.categoryId,
      categoryName: e.categoryName,
      emoji: e.emoji,
      spent: e.spent,
      budget: e.amount,
    }));

    return [...budgetedMapped, ...nonBudgeted];
  },
};
