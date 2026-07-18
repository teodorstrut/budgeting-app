import { categoryRepository } from '../database/repositories/categoryRepository';
import { budgetRepository } from '../database/repositories/budgetRepository';
import { settingsService } from './settingsService';
import { CategorySyncRow } from '../types/sync';
import { SETTING_KEYS } from '../constants/settings';
import { sanitizeForSheets } from './googleSheetsUtils';
import { isValidTransactionType } from '../utils/validators';
import { readSheetRange, buildRowIndex, batchUpdateRows, appendRows } from './sync/sheetRowSync';

// ─── sheet layout ─────────────────────────────────────────────────────────────
// Col A: Emoji | Col B: Category Name | Col C: Type | Col D: Budget

const SHEET_HEADERS = ['Emoji', 'Category Name', 'Type', 'Budget'];

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Stable dedup key used to match sheet rows with local categories. */
const makeDedupKey = (emoji: string, name: string): string =>
  `${emoji.trim()}_${name.trim().toLowerCase()}`;

/** Parse a raw sheet row into a CategorySyncRow. Returns null for invalid/header rows. */
const parseSheetRow = (row: string[]): CategorySyncRow | null => {
  const emoji = row[0]?.trim() ?? '';
  const name = row[1]?.trim() ?? '';
  const type = row[2]?.trim() ?? '';
  const budgetRaw = row[3]?.trim() ?? '';

  if (!name || !isValidTransactionType(type)) return null;

  const budgetNum = budgetRaw ? Number(budgetRaw.replace(',', '.')) : NaN;
  const budget = !isNaN(budgetNum) && budgetNum > 0 ? budgetNum : null;

  return { emoji, name, type, budget };
};

// ─── config ───────────────────────────────────────────────────────────────────

interface CategorySyncConfig {
  spreadsheetId: string;
  sheetName: string;
}

// ─── service ──────────────────────────────────────────────────────────────────

export const categorySyncService = {
  getCategorySyncConfig: (): CategorySyncConfig | null => {
    const spreadsheetId = settingsService.getSetting(SETTING_KEYS.CATEGORY_SYNC_SPREADSHEET_ID);
    const sheetName = settingsService.getSetting(SETTING_KEYS.CATEGORY_SYNC_SHEET_NAME);
    if (!spreadsheetId || !sheetName) return null;
    return { spreadsheetId, sheetName };
  },

  /**
   * Push all local categories and their budgets to the configured sheet.
   * - Existing rows (matched by dedup key) are updated in place.
   * - New categories are appended in a single batch call.
   * - The header row is written automatically if the sheet is empty.
   */
  exportCategories: async (token: string): Promise<{ rowsWritten: number }> => {
    const config = categorySyncService.getCategorySyncConfig();
    if (!config) throw new Error('Category sync is not configured.');

    const { spreadsheetId, sheetName } = config;
    const encodedSheetId = encodeURIComponent(spreadsheetId);

    // 1. Read current sheet contents (including the header row, if any).
    const existingRows = await readSheetRange(token, encodedSheetId, sheetName, 'A:D');

    // 2. Ensure header row exists
    const hasHeader =
      existingRows.length > 0 &&
      existingRows[0][0]?.toLowerCase() === 'emoji';

    // 3. Build dedup map: key → 1-based sheet row number.
    //    Row 1 is the header, data starts at row 2 (index 1 in existingRows).
    const dedupMap = buildRowIndex(
      existingRows.slice(1),
      (row) => {
        const emoji = row[0] ?? '';
        const name = row[1] ?? '';
        return emoji.trim() || name.trim() ? makeDedupKey(emoji, name) : '';
      },
      2,
    );

    // 4. Gather local categories and budget amounts
    const categories = categoryRepository.getAll();
    const budgetMap = new Map(budgetRepository.getAll().map((b) => [b.categoryId, b.amount]));

    const rowsToAppend: (string | number)[][] = [];
    const rowsToUpdate: Array<{ rowNum: number; values: (string | number)[] }> = [];

    for (const cat of categories) {
      const emoji = cat.emoji ?? '';
      const budget = cat.id != null ? budgetMap.get(cat.id) : undefined;
      const rowValues: (string | number)[] = [
        sanitizeForSheets(emoji),
        sanitizeForSheets(cat.name),
        sanitizeForSheets(cat.type),
        budget != null ? String(budget) : '',
      ];

      const key = makeDedupKey(emoji, cat.name);
      const existingRowNum = dedupMap.get(key);
      if (existingRowNum != null) {
        rowsToUpdate.push({ rowNum: existingRowNum, values: rowValues });
      } else {
        rowsToAppend.push(rowValues);
      }
    }

    if (!hasHeader) {
      rowsToUpdate.push({ rowNum: 1, values: SHEET_HEADERS });
    }

    // 5. Batch-update existing rows (+ header if missing), then append new ones.
    await batchUpdateRows(token, encodedSheetId, sheetName, 'A:D', rowsToUpdate);
    await appendRows(token, encodedSheetId, sheetName, 'A:D', rowsToAppend);

    settingsService.setSetting(
      SETTING_KEYS.CATEGORY_SYNC_LAST_EXPORT_AT,
      new Date().toISOString(),
    );
    return { rowsWritten: rowsToUpdate.length - (hasHeader ? 0 : 1) + rowsToAppend.length };
  },

  /**
   * Pull categories and budgets from the configured sheet and merge into local DB.
   * - Categories not found locally (by dedup key) are created.
   * - Type is updated if it differs.
   * - Budget conflict resolution: highest value wins.
   */
  importCategories: async (token: string): Promise<{ categoriesProcessed: number }> => {
    const config = categorySyncService.getCategorySyncConfig();
    if (!config) throw new Error('Category sync is not configured.');

    const { spreadsheetId, sheetName } = config;
    const encodedSheetId = encodeURIComponent(spreadsheetId);
    const rows = await readSheetRange(token, encodedSheetId, sheetName, 'A:D');

    // Nothing to import (empty sheet or header only)
    if (rows.length <= 1) {
      settingsService.setSetting(
        SETTING_KEYS.CATEGORY_SYNC_LAST_IMPORT_AT,
        new Date().toISOString(),
      );
      return { categoriesProcessed: 0 };
    }

    // Build local lookup: dedup key → category
    const localMap = new Map(
      categoryRepository.getAll().map((c) => [makeDedupKey(c.emoji ?? '', c.name), c]),
    );

    let processed = 0;

    // Row 0 is the header — data starts at index 1
    for (let i = 1; i < rows.length; i++) {
      const syncRow: CategorySyncRow | null = parseSheetRow(rows[i]);
      if (!syncRow) continue;

      const key = makeDedupKey(syncRow.emoji, syncRow.name);
      const existing = localMap.get(key);
      let categoryId: number;

      if (existing) {
        if (existing.type !== syncRow.type) {
          categoryRepository.update(existing.id!, { type: syncRow.type });
        }
        categoryId = existing.id!;
      } else {
        categoryId = categoryRepository.create({
          emoji: syncRow.emoji,
          name: syncRow.name,
          type: syncRow.type,
        });
      }

      // Highest budget wins
      if (syncRow.budget != null && syncRow.budget > 0) {
        const localBudget = budgetRepository.getByCategory(categoryId);
        if (localBudget == null || syncRow.budget > localBudget.amount) {
          budgetRepository.upsert(categoryId, syncRow.budget);
        }
      }

      processed++;
    }

    settingsService.setSetting(
      SETTING_KEYS.CATEGORY_SYNC_LAST_IMPORT_AT,
      new Date().toISOString(),
    );
    return { categoriesProcessed: processed };
  },
};
