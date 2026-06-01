# Budgeting Ledger v1.1 — Implementation Plan

> Companion to `development-plan-1-1.md`. This document contains the technical
> implementation breakdown for all bugs and features in the v1.1 milestone.

---

## Overview

| # | Item | Type | Phase | Complexity |
|---|------|------|-------|------------|
| 1a | Back navigation loses month context | Bug | 1 | Low |
| 1b | Dual keyboard / calculator conflict | Bug | 1 | Low |
| 1c | Auto-sync duplicates transactions | Bug | 1 | Low |
| 1d | Month start day ignored on screen open | Bug | 1 | Low |
| 2a | Reports category drilldown modal | Feature | 2 | Medium |
| 2c | Category & budget sync with Google Sheets | Feature | 3 | Medium |
| 2b | Read-only foreign transactions | Feature | 4–5 | High |

Phases are ordered by increasing scope. Phases 2–3 are independent of 4–5 and
can be parallelised once Phase 1 is complete.

---

## Phase 1 — Bug Fixes

No schema changes. All fixes are isolated to existing files.

---

### Bug 1a — Back navigation resets month in History

**Root cause**  
`add.tsx` calls `router.replace('/history')` after a save or delete. `replace`
destroys the existing `history.tsx` stack frame and mounts a fresh one, which
resets `anchorMonth` to the current calendar month. Using `router.back()`
instead restores the existing frame and its state.

**Files**
- `app/add.tsx`
- `app/bill-splitter.tsx` (audit for same pattern)

**Changes**

| Location in `add.tsx` | Before | After |
|---|---|---|
| `handleSave()` — edit branch | `router.replace('/history')` | `router.back()` |
| `handleSave()` — new transaction branch | `router.push('/')` | `router.back()` |
| `handleDelete()` | `router.replace('/history')` | `router.back()` |

> `router.back()` is safe here because all entry points into `add.tsx` use
> `router.push`, so there is always a frame to pop back to.

---

### Bug 1b — Native keyboard and calculator both visible simultaneously

**Root cause**  
Tapping the amount `AppSelectorField` opens `CalculatorKeypad` but does not
dismiss the native soft keyboard that may already be raised from the Note
field. There is no cross-dismiss coordination between the two inputs.

**File**: `app/add.tsx`

**Changes**
1. Import `Keyboard` from `react-native`.
2. In the amount `AppSelectorField` `onPress` handler, call `Keyboard.dismiss()`
   before `setShowCalculator(true)`.
3. Add `onFocus={() => setShowCalculator(false)}` to the Note `AppTextInput`.

---

### Bug 1c — Auto-sync creates duplicate rows in Google Sheets

**Root causes**

1. **Race condition (primary)** — the iOS/Android background task and the
   foreground `handleAppBecameActive()` call both invoke
   `syncTransactionsToGoogleSheet()`. Both pass the `shouldRunAutoSyncNow()`
   guard before either one sets `lastRunDay`, so two incremental syncs run
   concurrently. The second one reads the same sync-key column snapshot as the
   first, marks the same new transactions as "not in sheet", and appends them a
   second time.

2. **`deletedRowValues` returns 8 columns instead of 9** — the Deleted At
   column (col I) is omitted, leaving it blank for deleted rows. This is a
   separate correctness bug.

**Files**
- `services/syncService.ts`
- `services/autoSyncService.ts` (no changes needed once syncService is guarded)

**Changes in `syncService.ts`**
1. Add a module-level flag:
   ```ts
   let isSyncing = false;
   ```
2. At the top of `syncTransactionsToGoogleSheet`:
   ```ts
   if (isSyncing) throw new Error('Sync already in progress.');
   isSyncing = true;
   ```
   Wrap the entire body in `try/finally { isSyncing = false; }`.
3. Fix `deletedRowValues` — add the `deletedAt` ISO string as the 9th element
   so col I (Deleted At) is written:
   ```ts
   // before (8 elements):
   sanitizeForSheets(deletedAt),  // col H: Updated At
   // after (9 elements):
   sanitizeForSheets(deletedAt),  // col H: Updated At
   sanitizeForSheets(deletedAt),  // col I: Deleted At  ← add this
   ```

---

### Bug 1d — History and Reports open on the wrong month period

**Root cause**  
Both `history.tsx` and `reports.tsx` initialise `anchorMonth` with
`new Date()`, which is the current **calendar** month. When `monthStartDay` is,
say, 15 and today is June 1, the current billing period is May 15–June 14, but
both screens open on the June period instead.

`settingsService.getMonthStartDay()` reads from SQLite **synchronously**, so
it can be called directly inside a `useState` lazy initialiser — no async
loading required.

**Files**: `app/history.tsx`, `app/reports.tsx`

**Change — `anchorMonth` initial state (both files)**

Replace:
```ts
const [anchorMonth, setAnchorMonth] = useState(() => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
});
```

With:
```ts
const [anchorMonth, setAnchorMonth] = useState(() => {
  const day = settingsService.getMonthStartDay();
  const startStr = monthUtils.getCurrentMonthStart(day); // e.g. "2026-05-15"
  const [y, m] = startStr.split('-').map(Number);
  return new Date(y, m - 1, 1);
});
```

**Additional change — `useFocusEffect` re-alignment**  
Add a `hasManuallyNavigated` ref (default `false`, set to `true` inside
`moveMonth`). In `useFocusEffect`, when `monthStartDay` changes, only
re-align `anchorMonth` if `hasManuallyNavigated.current === false`, so a user
who has already navigated to a different month is not forcibly redirected.

---

## Phase 2 — Reports Category Drilldown (Feature 2a)

**Goal**: tapping a row in the "All Categories" card opens a slide-up modal
listing all transactions for that category in the current period.

---

### New component — `components/ui/CategoryTransactionsModal.tsx`

**Props**
```ts
interface Props {
  visible: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  emoji: string;
  periodStart: string;   // YYYY-MM-DD
  periodEnd: string;     // YYYY-MM-DD
}
```

**Behaviour**
- Fetches via `transactionService.getTransactionsForCategory(categoryId, start, end)` (new method, see below).
- Renders transactions with `TransactionItem` in `dateDisplayMode="time"`, read-only (`onPress` omitted).
- Shows category emoji + name and period total in the modal header.
- Reuses the same **280 ms parallel slide-up + backdrop fade** animation used
  by `CalculatorKeypad` and `CategoryPickerModal`.

---

### New method — `transactionService.getTransactionsForCategory`

```ts
getTransactionsForCategory(
  categoryId: number,
  start: string,
  end: string
): Transaction[]
```

Calls `transactionRepository.getByDateRange(start, end)` and filters results
where `item.categoryId === categoryId`.

---

### Changes in `app/reports.tsx`

1. Add state: `drillDownCategory: AllCategoryEntry | null = null`.
2. Wrap each category row `<View>` in `<TouchableOpacity activeOpacity={0.75}`
   that sets `drillDownCategory = entry` on press.
3. Add a small `FontAwesome "chevron-right"` icon (size 11, colour
   `onSurfaceVariant`) on the right of each category row header to signal
   tappability.
4. Render `<CategoryTransactionsModal>` outside the `ScrollView`, controlled by
   `drillDownCategory`.

---

## Phase 3 — Category & Budget Sync (Feature 2c)

**Goal**: export and import the user's categories (and their budgets) to a
dedicated Google Sheets tab. Multiple users' data is deduplicated by
`emoji + lowercase(name)`. Budget conflict resolution: highest value wins.

**Sheet columns**: `Emoji | Category Name | Type | Budget`

---

### Constants — `constants/settings.ts`

Add to `SETTING_KEYS`:
```ts
CATEGORY_SYNC_SPREADSHEET_ID: 'categorySyncSpreadsheetId',
CATEGORY_SYNC_SHEET_NAME:     'categorySyncSheetName',
CATEGORY_SYNC_SPREADSHEET_NAME: 'categorySyncSpreadsheetName',
CATEGORY_SYNC_LAST_EXPORT_AT: 'categorySyncLastExportAt',
CATEGORY_SYNC_LAST_IMPORT_AT: 'categorySyncLastImportAt',
```

---

### Type — `types/sync.ts`

```ts
export interface CategorySyncRow {
  emoji:  string;
  name:   string;
  type:   'income' | 'expense';
  budget: number | null;
}
```

---

### Shared Google helpers — `services/googleSheetsUtils.ts` (new)

Extract from `syncService.ts` into a shared module:
- `authorizedFetch(token, url, init?)`
- `parseErrorMessage(response, fallback)`
- `sanitizeForSheets(value)`

Update `syncService.ts` to import from the new module instead.

---

### New service — `services/categorySyncService.ts`

**`ensureCategorySheetTab(token, spreadsheetId, sheetName)`**  
Mirrors `syncService.ensureAppSheetTab`. Creates the tab and writes the header
row (`Emoji | Category Name | Type | Budget`) if the tab does not exist.

**`exportCategories(token)`**  
1. Read all local categories from `categoryRepository.getAll()`.
2. Read all local budgets from `budgetRepository.getAll()`, build a
   `Map<categoryId, amount>`.
3. Build a `CategorySyncRow[]` from the join.
4. Read all existing rows from the categories sheet.
5. Merge: for rows already in the sheet (matched by dedup key), keep the
   **higher** budget. Append rows not yet in the sheet.
6. Full-overwrite the sheet data range with the merged result.

**`importCategories(token)`**  
1. Read all rows from the categories sheet.
2. For each row, compute the dedup key `${emoji.trim()}_${name.trim().toLowerCase()}`.
3. Check the local categories list for a match:
   - **Match found**: if the sheet budget > local budget, call
     `budgetRepository.upsert({ categoryId, amount: sheetBudget })`.
   - **No match**: create the category via `categoryRepository.create(...)`,
     then upsert the budget if `budget != null`.

**Dedup key**:
```ts
const dedupKey = (emoji: string, name: string) =>
  `${emoji.trim()}_${name.trim().toLowerCase()}`;
```

---

### UI — `app/sync-settings.tsx`

Add a new "Category & Budget Sync" section below the transactions sync section:

- **Sheet selector**: same UX as the transactions sheet selector (spreadsheet
  list, tab picker), but reads/writes the new `CATEGORY_SYNC_*` setting keys.
- **Validation**: if the user selects the same spreadsheet, enforce a different
  tab name than the transactions tab. Show an inline error if they match.
- **"Export Categories" button**: calls `categorySyncService.exportCategories(token)`;
  shows row count + timestamp on success.
- **"Import Categories" button**: calls `categorySyncService.importCategories(token)`;
  shows categories created/updated count on success.

---

## Phase 4 — Foreign Transactions: Schema & Sync

---

### Sub-phase 4a — Database migration

**File**: `database/schema.ts`

Add idempotent `ALTER TABLE` migrations inside `initDatabase()`. Use
`PRAGMA table_info(tableName)` to check whether the column already exists
before attempting `ALTER TABLE`.

**New columns**

| Table | Column | Type | Default |
|---|---|---|---|
| `transactions` | `ownerKey` | `TEXT` | `NULL` |
| `transactions` | `isReadOnly` | `INTEGER NOT NULL` | `0` |
| `categories` | `ownerKey` | `TEXT` | `NULL` |
| `categories` | `isAdopted` | `INTEGER NOT NULL` | `0` |

> Existing rows are unaffected: `ownerKey = NULL` means "owned by the current
> user" and `isReadOnly = 0` means interactive.

---

**Type updates**

`Transaction` in `transactionRepository.ts`:
```ts
ownerKey?:   string | null;
isReadOnly?: number;   // 0 = own, 1 = foreign read-only
```

`Category` in `categoryRepository.ts`:
```ts
ownerKey?:  string | null;
isAdopted?: number;   // 1 = foreign category adopted as own
```

---

**New repository methods**

`transactionRepository`:
- `upsertForeignTransaction(data: Omit<Transaction, 'id'> & { syncKey: string })` — `INSERT OR REPLACE` keyed on `syncKey`; always sets `isReadOnly = 1`.
- `deleteForeignBySyncKey(syncKey: string)` — removes a foreign row.
- `getAll(options?: { includeReadOnly?: boolean })` — adds `WHERE isReadOnly = 0` when `includeReadOnly` is `false` (default `false` to preserve existing callers).

`categoryRepository`:
- `getOrCreateForeignCategory(emoji: string, name: string, type: string, ownerKey: string): Category` — look up by `emoji + lowercase(name) + ownerKey`; create if not found.
- `adoptCategory(id: number)` — `UPDATE categories SET ownerKey = NULL, isAdopted = 1 WHERE id = ?`.
- `getForeignCategories()` — returns categories where `ownerKey IS NOT NULL AND isAdopted = 0`.

---

### Sub-phase 4b — Sync pulls foreign transactions

**File**: `services/syncService.ts`

**New helper — `mergeForeignTransactionsFromRows(rows, currentOwnerKey)`**

```
for each row in rows where row[1] (Owner Key column) != currentOwnerKey and row[1] is not empty:
  if row[8] (Deleted At) is non-empty:
    transactionRepository.deleteForeignBySyncKey(row[0])
  else:
    const cat = categoryRepository.getOrCreateForeignCategory(
      parseEmoji(row[4]), parseName(row[4]), row[3] as type, row[1]
    )
    transactionRepository.upsertForeignTransaction({
      syncKey:    row[0],
      ownerKey:   row[1],
      note:       row[2],
      type:       row[3],
      categoryId: cat.id,
      amount:     parseAmount(row[5]),
      date:       row[6],
      updatedAt:  row[7],
      isReadOnly: 1,
    })
```

**Category column format in the sheet is `"emoji name"` (e.g. `"🛒 Groceries"`)**
— parse by splitting on the first space.

**Changes to `performFullSync`**  
After the full-overwrite write completes, call
`mergeForeignTransactionsFromRows(existingRows, ownerKey)` using the rows read
at the start of the function.

**Changes to `performIncrementalSync`**  
After `appendNewRows`, re-read all rows from the sheet (or use the already-read
`keyToRow` data) and call `mergeForeignTransactionsFromRows` for any row whose
`updatedAt` (col H) is ≥ `lastSync` and whose `ownerKey` is not the current
owner.

---

## Phase 5 — Foreign Transactions: UI Layer

---

### Sub-phase 5a — `TransactionItem` foreign styling

**File**: `components/data/TransactionItem.tsx`

Add optional `isForeign?: boolean` prop.

When `isForeign` is `true`:
- Wrap the item's background view with `opacity: 0.65` and use
  `theme.colors.surfaceContainerHigh` as background (instead of the default
  transparent / card colour).
- Render a small `FontAwesome "user"` icon (size 10, colour
  `theme.colors.onSurfaceVariant`) overlaid on the bottom-right of the emoji
  badge to signal foreign ownership.
- Set `onPress={undefined}` — the row is non-interactive.
- Active opacity should be `1` (no press feedback).

**File**: `components/data/TransactionList.tsx`

Pass `isForeign={item.isReadOnly === 1}` to each `TransactionItem`.

---

### Sub-phase 5b — Ownership toggle

**New component — `components/ui/OwnershipToggle.tsx`**

A small, non-intrusive pill toggle:
- Two options: `"Mine"` and `"All"`
- Built on the existing `ToggleButtonGroup` with smaller font (12 px) and
  reduced padding
- Only rendered when at least one foreign transaction exists in the current
  visible data set (so solo users never see it)

**State addition** in `app/index.tsx`, `app/history.tsx`, `app/reports.tsx`:
```ts
const [ownership, setOwnership] = useState<'mine' | 'all'>('mine');
```

**Filtering**  
Pass `{ includeReadOnly: ownership === 'all' }` to all `transactionRepository`
/ `transactionService` calls on each screen.

**Placement**  
Render `<OwnershipToggle>` to the right of `<MonthNavigator>` on the same row,
or as a small floating chip just above the transaction list — whichever fits the
screen layout with least visual weight.

---

### Sub-phase 5c — Foreign categories in Manage Categories

**File**: `app/manage-categories.tsx`

1. Load foreign categories with `categoryRepository.getForeignCategories()`.
2. If the list is non-empty, render a "From Other Users" section below the
   existing expense/income sections.
3. Each row: emoji + name chip with `opacity: 0.6`, a dim `ownerKey` source
   label, and an **"Adopt"** `TouchableOpacity` button.
4. **Adopt action**:
   - Build the dedup key for the foreign category.
   - Check own categories for a match (same `emoji + lowercase(name)`).
   - If match exists → call `categoryRepository.adoptCategory(foreignId)` (the
     foreign category is now shadowed by the owned one; hide it from the list).
   - If no match → call `categoryRepository.create({ emoji, name, type })` to
     make an owned copy, then `categoryRepository.adoptCategory(foreignId)`.
5. After adoption, refresh both the own-categories list and the foreign list so
   the adopted entry disappears from "From Other Users".

---

## Phase 6 — Copilot Instructions File

**File to create**: `.github/copilot-instructions.md`

Content sections:
- **App description**: personal budgeting ledger, React Native / Expo, iOS + Android, SQLite local storage, optional Google Sheets sync.
- **Tech stack**: Expo SDK, Expo Router v3 (Stack navigator, no tabs), expo-sqlite (synchronous API), Google Sheets API v4, expo-task-manager for background sync, expo-secure-store for tokens.
- **Folder responsibilities**: `app/` — route screens only; `services/` — pure business logic; `database/` — repository pattern (synchronous sqlite calls); `components/ui|layout|data|charts/` — presentational; `providers/` — context; `theme/` — colour tokens + styles; `utils/` — pure helpers.
- **Key patterns**:
  - `monthUtils.getCurrentMonthStart(day)` + `getMonthPeriodForDate(day, dateStr)` for all billing-period calculations.
  - `settingsService.getMonthStartDay()` is **synchronous** — safe to call inside `useState` initialisers.
  - `useFocusEffect` for screen refresh on navigation return.
  - Navigation: always `router.push` into sub-screens; always `router.back()` to return — never `router.replace` for back navigation.
  - Sync: manual and auto-sync share the same `syncService.syncTransactionsToGoogleSheet()` code path. Full sync on first run or schema version change; incremental sync thereafter.
- **Colour tokens for muted / foreign UI**: `onSurfaceVariant` (dim text), `surfaceContainerHigh` (muted backgrounds), `outlineVariant` (dim borders).
- **v1.1 development status**: see `development-plan-1-1.md` (requirements) and `development-plan-1-1-implementation.md` (this file).

---

## File Change Summary

| File | Change type |
|------|-------------|
| `app/add.tsx` | Modify — bugs 1a, 1b |
| `app/bill-splitter.tsx` | Modify — bug 1a audit |
| `app/history.tsx` | Modify — bugs 1a, 1d; Phase 5b toggle |
| `app/reports.tsx` | Modify — bug 1d; Phase 2 drilldown; Phase 5b toggle |
| `app/index.tsx` | Modify — Phase 5b toggle |
| `app/sync-settings.tsx` | Modify — Phase 3 UI |
| `app/manage-categories.tsx` | Modify — Phase 5c |
| `services/syncService.ts` | Modify — bug 1c; Phase 4b |
| `services/autoSyncService.ts` | No change needed after syncService guard |
| `services/transactionService.ts` | Modify — Phase 2 new method |
| `services/googleSheetsUtils.ts` | **New** — shared Google fetch helpers (Phase 3) |
| `services/categorySyncService.ts` | **New** — Phase 3 |
| `database/schema.ts` | Modify — Phase 4a migration |
| `database/repositories/transactionRepository.ts` | Modify — Phase 4a |
| `database/repositories/categoryRepository.ts` | Modify — Phase 4a |
| `constants/settings.ts` | Modify — Phase 3 |
| `types/sync.ts` | Modify — Phase 3 |
| `components/ui/CategoryTransactionsModal.tsx` | **New** — Phase 2 |
| `components/ui/OwnershipToggle.tsx` | **New** — Phase 5b |
| `components/data/TransactionItem.tsx` | Modify — Phase 5a |
| `components/data/TransactionList.tsx` | Modify — Phase 5a |
| `.github/copilot-instructions.md` | **New** — Phase 6 |

---

## Verification Checklist

- [ ] **1a** — History at past month → tap edit → tap back → same past month shown; also tap Save → same past month shown
- [ ] **1b** — Focus Note field → tap Amount field → only `CalculatorKeypad` visible, native keyboard dismissed
- [ ] **1c** — Trigger two rapid sync calls → no duplicate rows in Google Sheet; deleted row now has Deleted At (col I) populated
- [ ] **1d** — Set `monthStartDay = 15`, date = June 1 → open History → "May 15–June 14" shown immediately; same for Reports
- [ ] **2a** — Reports → tap any category in "All Categories" → slide-up modal shows category's transactions with total
- [ ] **2c** — Export categories → correct sheet tab created with headers; re-import → dedup respected, highest budget wins
- [ ] **2b schema** — After migration, existing transactions have `ownerKey = NULL`, `isReadOnly = 0`
- [ ] **2b sync** — Manual sync with foreign rows in sheet → foreign transactions appear locally; sync again → no duplication
- [ ] **2b UI** — Foreign transactions shown with grey/muted styling and user icon; "Mine" toggle hides them
- [ ] **2b adopt** — Adopt a foreign category → it appears in own category list; dedup match prevents duplicate