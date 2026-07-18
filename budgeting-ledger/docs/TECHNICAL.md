# Technical Reference

Implementation-level detail: schema, data access layer, sync protocol, component library, build config, security posture. For the high-level system map see [ARCHITECTURE.md](./ARCHITECTURE.md); for product behavior see [FUNCTIONAL.md](./FUNCTIONAL.md); for non-obvious constraints and workarounds see [GOTCHAS.md](./GOTCHAS.md); for a manual verification checklist see [MANUAL_TESTING.md](./MANUAL_TESTING.md).

## Database schema

Defined in `database/schema.ts` (`createTables()`), run on every app start — safe because every statement is idempotent (`CREATE TABLE IF NOT EXISTS`, or a `PRAGMA table_info` check before `ALTER TABLE ADD COLUMN`). There is no migration framework/versioning tool; migrations are hand-rolled.

| Table | Columns | Notes |
|---|---|---|
| `categories` | `id` PK autoincrement · `emoji` TEXT · `name` TEXT NOT NULL · `type` TEXT NOT NULL (`'income'\|'expense'`) · `ownerKey` TEXT · `isAdopted` INTEGER NOT NULL DEFAULT 0 | `ownerKey`/`isAdopted` added by migration, support foreign-category adoption |
| `transactions` | `id` PK autoincrement · `amount` REAL NOT NULL CHECK(≥0) · `type` TEXT NOT NULL CHECK IN ('income','expense') · `categoryId` INTEGER FK→`categories(id)` · `note` TEXT · `date` TEXT NOT NULL (ISO) · `createdAt`/`updatedAt` TEXT DEFAULT CURRENT_TIMESTAMP · `ownerKey` TEXT · `isReadOnly` INTEGER NOT NULL DEFAULT 0 | Indexes: `idx_transactions_date`, `idx_transactions_categoryId`, `idx_transactions_type` |
| `budgets` | `id` PK autoincrement · `categoryId` INTEGER NOT NULL UNIQUE FK→`categories(id)` · `amount` REAL NOT NULL CHECK(≥0) | One budget per category, enforced by the UNIQUE constraint. Table is dropped and recreated if a legacy `period` column is detected. |
| `settings` | `id` PK · `key` TEXT UNIQUE NOT NULL · `value` TEXT | Generic key/value store — app settings (theme, month-start-day) and sync bookkeeping both live here (`settingsService.ts`) |
| `sync_configs` | `id` PK · `provider` TEXT NOT NULL (`'google'`) · `spreadsheetId` · `sheetName` · `lastSync` (ISO) · `status` DEFAULT `'inactive'` | One row per provider; only `'google'` is used today |
| `sync_deletions` | `transactionId` INTEGER PK · `deletedAt` TEXT NOT NULL | Tombstones for propagating local deletes to the sheet; purged after 90 days by `syncDeletionRepository.purgeOldTombstones` |

`seedData()` inserts 5 default expense categories (🍎 Groceries, 🏠 Rent, 💡 Utilities, 🍽️ Dining Out, 🚗 Transport) only if `categories` is empty. `resetAndReseed()` (dev/reset path) deletes rows in FK-safe order and resets `sqlite_sequence`.

Relationships: `transactions.categoryId → categories.id`, `budgets.categoryId → categories.id`; `PRAGMA foreign_keys = ON` enforces both. There is no `accounts`/`users` table — "ownership" is modeled purely by the `ownerKey` string column (see [Sync mechanism](#google-sheets-sync-mechanism)).

## Data access layer

**Repositories** (`database/repositories/`, one file per table) hold raw parameterized SQL only, no validation, no business logic:

| Repository | Type | Notable methods |
|---|---|---|
| `transactionRepository.ts` | `Transaction` | `create`, `getAll`, `getByDateRange`, `getChangedSince(sinceIso)`, `getById`, `update`, `delete`, `getCategoryTotalsForDateRange(…, type?)`, `getExpenseTotalForDateRange(…, categoryId?, type?)`, `upsertForeignTransaction`, `deleteForeignBySyncKey`, `getForeign` |
| `categoryRepository.ts` | `Category` | CRUD, `getAllSortedByUsage`, `getOrCreateForeignCategory`, `adoptCategory`, `getForeignCategories` |
| `budgetRepository.ts` | `Budget` | `upsert` (`INSERT OR REPLACE`), `getAll`, `getByCategory`, `delete`, `deleteAll` |
| `syncConfigRepository.ts` | — | `getGoogleConfig`, `upsertGoogleConfig`, `setGoogleStatus` |
| `syncDeletionRepository.ts` | — | `recordTransactionDeletion` (upsert via `ON CONFLICT`), `getDeletedSince`, `purgeOldTombstones` |

`getExpenseTotalForDateRange` and `getCategoryTotalsForDateRange` both default their `type` param to `'expense'` but accept `'income'` too — despite the former's name, both are used to power expense *or* income aggregates (see Reports in [FUNCTIONAL.md](./FUNCTIONAL.md)).

**Services** (`services/`) sit above repositories and hold everything else — screens call these, never repositories directly:

| Service | Responsibility |
|---|---|
| `transactionService.ts` | `validateTransaction` (positive finite amount, valid type, valid ISO date, existing category); `addTransaction`/`updateTransaction`/`deleteTransaction` (the delete path is the one place raw `db.execSync` transaction control — explicit `BEGIN/COMMIT/ROLLBACK` — is used, wrapping the tombstone insert + row delete); month-aware summaries (`getCurrentMonthSummary`, `getMonthlySummaries`); reporting helpers (`getCategorySpendingForMonth(…, type?)`, `getSpendingEvolutionForPeriods(…, categoryId?, type?)`, `getTransactionsForCategory`); sync row shaping (`getRowsForGoogleSync`, `getRowsChangedSince`, `getDeletedRowsChangedSince`) |
| `budgetService.ts` | `getBudgetsWithCategories`, `saveBudgets` (delete-all + re-insert), `getBudgetHealthData` (a multi-table JOIN run directly via `db.getAllSync`, the one place a service bypasses the repository layer), `getAllCategoryBudgetData` |
| `settingsService.ts` | Generic get/set/number/boolean helpers over the `settings` table, plus Google-sync-specific convenience getters/setters (enabled flag, spreadsheet name, last error, auto-sync bookkeeping, owner key) |
| `syncService.ts` | Google OAuth token lifecycle, Sheets API calls, transaction sync orchestration (full + incremental), foreign-row pull/merge |
| `autoSyncService.ts` | Background task registration, once-per-day guard, `AppState` foreground trigger |
| `categorySyncService.ts` | Export/import of categories + budgets to a dedicated Sheets tab |
| `googleSheetsUtils.ts` | Shared HTTP helpers used by both sync services: `authorizedFetch`, `parseErrorMessage`, `sanitizeForSheets` |

**Models** (TypeScript interfaces):

| Type | Defined in | Shape |
|---|---|---|
| `Transaction` | `database/repositories/transactionRepository.ts` | `{ id?, amount, type: 'income'\|'expense', categoryId?, note?, date, createdAt?, updatedAt?, ownerKey?, isReadOnly? }` |
| `Category` | `database/repositories/categoryRepository.ts` | `{ id?, emoji?, name, type: 'income'\|'expense', ownerKey?, isAdopted? }` |
| `Budget` | `database/repositories/budgetRepository.ts` | `{ id?, categoryId, amount }` |
| `SyncConfig`, `SyncProvider`, `SyncStatus`, `GoogleSpreadsheet(Page)`, `SyncRow`, `CategorySyncRow` | `types/sync.ts` | Sync-domain DTOs |
| `Theme` | `types/theme.ts` | UI theming, unrelated to persisted data |

There is no `Account`/`User` model — "ownership" is a random per-install UUID (`settingsService.ensureSyncOwnerKey()`, generated via `expo-crypto`'s `randomUUID()`), not an authenticated entity.

## Google Sheets sync mechanism

Two independent sync surfaces, both Google OAuth-gated (`expo-auth-session`, PKCE) but otherwise unrelated to any backend — there is no backend.

### Transaction sync (`services/syncService.ts`)

- **Tokens**: access/refresh tokens live in `expo-secure-store`. `refreshGoogleAccessToken()` calls `https://oauth2.googleapis.com/token` directly; sign-out calls `https://oauth2.googleapis.com/revoke`.
- **Sheet layout** (columns A–I): `Sync Key | Owner Key | Note | Type | Category | Amount | Datetime | Updated At | Deleted At`. Sync key = `${ownerKey}::${localId}`.
- **Triggers**: manual ("Sync Now" in `app/sync-settings.tsx`), a 15-minute-interval `expo-background-task`, and an `AppState` foreground listener. Actual execution is gated by `shouldRunAutoSyncNow()` — at most once per local calendar day, only after 2 AM local time. A module-level `isSyncing` flag prevents the background task and the foreground trigger from racing each other.
- **Two strategies**, chosen inside `syncTransactionsToGoogleSheet`:
  - **`performFullSync`** — used on first sync, or when `SYNC.SCHEMA_VERSION` differs from the stored `googleSyncSchemaVersion` setting (forces a resync after a schema change). Reads every row of the sheet (`readAllDataRows`, range `A2:I`) into a `keyToRow: Map<syncKey, rowNumber>` index, then classifies local rows into:
    1. `toUpdate` — own rows whose sync key already exists in the sheet → update that exact row in place.
    2. `toAppend` — own rows with no existing sheet row → appended.
    3. `toMarkDeleted` — own sheet rows whose sync key is no longer in the local DB (and not already tombstoned in the sheet) → overwritten with a `(deleted)` marker using the real tombstone timestamp from `sync_deletions` when available.
    Foreign rows (other owners' sync keys) are never touched during the deletion scan. All in-place writes go through a single `values:batchUpdate` call.
  - **`performIncrementalSync`** — used otherwise; filters `transactionRepository.getChangedSince(lastSync)` and `syncDeletionRepository.getDeletedSince(lastSync)`.
- **Pulling foreign rows**: `pullForeignRowsFromSheet(ownerKey, rows)` scans rows whose Owner Key ≠ local `ownerKey`, parses the category column (format `"emoji name"`), and calls `categoryRepository.getOrCreateForeignCategory` + `transactionRepository.upsertForeignTransaction`/`deleteForeignBySyncKey` to mirror another owner's rows locally as **read-only** (`isReadOnly = 1`). Both full and incremental sync call this after writing local rows — this is how two people sharing one spreadsheet see each other's entries without either side's writes colliding (a client only ever mutates rows under its own owner-key prefix).

### Category/budget sync (`services/categorySyncService.ts`)

Separate sheet/tab, columns A–D: `Emoji | Category Name | Type | Budget`. Configured independently via `SETTING_KEYS.CATEGORY_SYNC_*`.
- Dedup key: `` `${emoji.trim()}_${name.trim().toLowerCase()}` `` — two categories with the same emoji and case-insensitive name are treated as the same row.
- `exportCategories` — joins categories with budgets, merges with existing sheet rows (matched by dedup key, keeping the higher budget), appends new rows, overwrites the sheet's data range with the merged result.
- `importCategories` — for each sheet row: if a local category matches the dedup key, upsert the budget only if the sheet's budget is higher than the local one ("highest budget wins"); otherwise create a new local category (+ budget).

### Shared helpers (`services/googleSheetsUtils.ts`)

- `sanitizeForSheets(value)` — formula-injection guard; prefixes any string starting with `=`, `+`, `-`, `@`, tab, or CR with a `'`. Applied to every string field written to a sheet.
- `authorizedFetch(token, url, init?)` — attaches the `Bearer` header.
- `parseErrorMessage(response, fallback)` — maps 401/403/404/429/5xx to user-facing copy without leaking raw response bodies.

OAuth redirects land on `app/oauthredirect.tsx`, which completes the `expo-web-browser` auth session and routes back to `sync-settings`.

## Component library

Check these before writing new UI — everything here already exists.

### `components/ui/`

| Component | Key props | Used in |
|---|---|---|
| `Card` | `children`, `style?` | Wraps most content sections |
| `EmptyState` | `title`, `subtitle?`, `icon?` | No-data states across all screens |
| `SummaryTile` | `title`, `value: string`, `color?` | `index.tsx` income/expense tiles |
| `ToggleButtonGroup<T>` | `options[]`, `selected`, `onSelect`, `activeColor`, `activeTextColor`, `inactiveTextColor`, `borderColor` | Income/expense toggles, dark/light toggle |
| `AppTextInput` | Extends `TextInputProps`, `containerStyle?` | All text inputs (forwardRef for `.focus()`) |
| `AppInputLabel` | `children`, `style?` | Labels above form fields |
| `AppSelectorField` | Extends `TouchableOpacityProps`, `children` | Tappable selector rows (category, date/time, amount) |
| `CalculatorKeypad` | `visible`, `initialValue`, `onConfirm`, `onDismiss`, `onHeightChange?` | Amount entry in `add.tsx`, `budgets.tsx`, `bill-splitter.tsx` |
| `CategoryPickerModal` | `visible`, `onClose`, `categories[]`, `onSelectCategory`, `selectedCategoryId?`, `title?`, `emptyMessage?`, `onManageCategories?`, `showAllOption?`, `onSelectAll?` | Category selection everywhere |
| `ProgressBar` | `progress` (0–1), `height?`, `color`, `trackColor`, `style?` | Budget health ratios |
| `BudgetHealthWidget` | `entries: BudgetHealthEntry[]` | `index.tsx` dashboard, links to `/budget-health` |
| `AnimatedBackdrop` | `opacity: Animated.Value`, `visible`, `onPress` | Shared by all modals and `CalculatorKeypad` |
| `MonthStartDayPicker` | — | `settings.tsx` |
| `TransactionDateTimeField` | — | `add.tsx`, `bill-splitter.tsx` |
| `SplitSlider` | — | `bill-splitter.tsx` step 2 |
| `CategoryTransactionsModal` | `visible`, `onClose`, `categoryId`, `categoryName`, `emoji`, `periodStart`, `periodEnd`, `type?: 'expense'\|'income'` (default `'expense'`, controls the +/- sign on the total) | `reports.tsx` category drilldown |
| `OwnershipToggle` | `value: 'mine' \| 'all'`, `onChange` | `index.tsx`, `history.tsx` — filters foreign vs. own transactions |

### `components/layout/`

| Component | Key props | Used in |
|---|---|---|
| `Header` | `title`, `showBackButton?`, `onBackPress?`, `rightIconName?`, `onRightPress?`, `titleColor?`, `containerStyle?`, `titleStyle?` | Screens without the bottom NavBar |
| `NavBar` | — (reads pathname via `usePathname`) | index, history, reports, budgets, budget-health |
| `MonthNavigator` | `label: string`, `onPrevious`, `onNext` | history.tsx, reports.tsx |
| `AddTransactionButton` | — | All screens that include NavBar |

### `components/data/`

| Component | Key props | Used in |
|---|---|---|
| `TransactionList` | `transactions[]`, `title?`, `onTransactionPress?`, `dateDisplayMode?` | index.tsx, history.tsx |
| `TransactionItem` | `transaction`, `categoryEmoji?`, `categoryName?`, `onPress?`, `dateDisplayMode?`, `isForeign?` | Rendered inside `TransactionList`; `isForeign=true` → muted styling + user icon, no press |

### `components/charts/`

| Component | Key props | Used in |
|---|---|---|
| `DonutChart` | `data: DonutSlice[]`, `totalLabel`, `totalValue`, `size?` | reports.tsx expense/income breakdown |
| `SpendingBarChart` | `data: BarDataPoint[]` | reports.tsx monthly trend |

## Code conventions

- **Navigation**: `router.push('/add')` / `router.push({ pathname: '/add', params: { editId: String(id) } })` to enter a screen; `router.back()` — never `router.replace()` — to return (replace destroys the previous stack frame's state, e.g. the currently-viewed month in History).
- **Screen refresh**: `useFocusEffect(useCallback(() => { loadData() }, [/* stable deps */]))`.
- **Billing periods are not calendar months** — always derive boundaries from `utils/monthUtils.ts` using `settingsService.getMonthStartDay()` (synchronous — safe inside `useState` lazy initializers), never `new Date()` directly. Screens with navigable months (`history.tsx`, `reports.tsx`) hold `anchorMonth: Date` state and a `hasManuallyNavigated` ref so a `useFocusEffect` re-alignment doesn't override a user who already navigated away.
- **Theming**: `const { theme } = useTheme(); const shared = useSharedStyles();` — always `theme.colors.*`/`theme.spacing.*`/`theme.typography.*`, never a hardcoded hex value (exception: semantic status colors outside the palette, e.g. `#ef4444` for over-budget).
- **Modals**: 280ms `Animated.parallel` slide-up (`translateY` 600→0) + backdrop fade (opacity 0→0.5), paired with `<AnimatedBackdrop>`.
- **Destructive actions** go through `utils/confirmDialog.ts` before executing.
- **Formatting**: `utils/formatting.ts` — `formatAmount(value, type)`, `formatRelativeDate(iso)`, `formatTime(iso)`.
- **Settings access**: DB-backed settings are synchronous (`settingsService.getMonthStartDay()`, `setSetting()`); credentials are async via SecureStore (`await settingsService.getGoogleAccountEmail()`).
- **Icons**: FontAwesome via `@expo/vector-icons` only — no other icon library.
- **State**: `useState`/`useContext` only — no Redux/Zustand/Jotai/MobX.
- **Repositories are never called from screens** — always go through a service.

## Build & config

- **`app.config.js`** (dynamic config): app id `com.teodorstrut.budgetingledger`, scheme `budgetingledger`, `newArchEnabled: true`, Android `edgeToEdgeEnabled`, typed routes + React Compiler experiments. Injects `GOOGLE_ANDROID_CLIENT_ID`/`GOOGLE_IOS_CLIENT_ID` from env/EAS secrets. Plugins: `expo-router`, datetimepicker, `expo-splash-screen`, `["expo-sqlite", { useSQLCipher: true }]`, `expo-secure-store`, `expo-background-task`, plus two custom config plugins that run during `expo prebuild`:
  - `withBackupRules` — writes `secure_store_backup_rules.xml` (Android 6–11) and `secure_store_data_extraction_rules.xml` (Android 12+), excluding SecureStore keys and `budgeting.db` from OS backups.
  - `withNetworkSecurityConfig` — writes `network_security_config.xml`, blocking cleartext HTTP and restricting TLS trust to the system CA bundle.
  - Both XML templates live in `config/android/`.
- **`eas.json`** — EAS Build profiles: `development` (dev client, internal), `preview` (internal), `production` (autoIncrement); CLI version gate `>=18.5.0`.
- **`tsconfig.json`** — extends `expo/tsconfig.base`, `strict: true`, path alias `@/*` → project root.
- **`eslint.config.js`** — flat config extending `eslint-config-expo/flat`, ignores `dist/*`.
- No `babel.config.js`/`metro.config.js` — Expo defaults only.
- `.env.local` (git-ignored) supplies `GOOGLE_ANDROID_CLIENT_ID`/`GOOGLE_IOS_CLIENT_ID` for local dev.
- No native `android/`/`ios/` directories are checked in — managed workflow; run `expo prebuild` to generate them.
- No test framework (Jest/RNTL/Detox) and no CI workflow currently exist in the repo.

## Security posture

Current-state summary (condensed from a prior standalone audit; re-verify claims against source before relying on them for anything security-critical):

- **Local storage**: SQLite encrypted at rest via SQLCipher (`useSQLCipher: true`). A 256-bit key is generated on first launch (`expo-crypto`) and stored in `expo-secure-store`, applied via `PRAGMA key` on every connection open. **Caveat**: this only takes effect in a native build produced via `expo prebuild` — running in Expo Go, the PRAGMA silently no-ops and the DB is unencrypted.
- **OAuth**: Google PKCE flow via `expo-auth-session`; access/refresh tokens and cached profile info live in `expo-secure-store` only, never in SQLite/AsyncStorage/logs. Sign-out revokes the refresh token server-side (`oauth2.googleapis.com/revoke`) and clears local keys.
- **Network**: all calls target `googleapis.com` over HTTPS; `network_security_config.xml` blocks cleartext traffic and restricts TLS trust to the system CA bundle (mitigates rogue/MDM CA interception; not full certificate pinning).
- **Input handling**: `validateTransaction` enforces positive finite amounts, valid type/date, existing category. `sanitizeForSheets()` neutralizes formula injection (`=`, `+`, `-`, `@`, tab, CR) on every string written to a Sheet.
- **Backups**: Android backup/data-extraction rules exclude SecureStore keys and `budgeting.db` from OS-level backup.
- **Known gaps** (as of the last review): no rooted/jailbroken device detection, no app-level PIN/biometric lock, no `FLAG_SECURE` (screenshots/app-switcher can expose data), no automated tests, no CI pipeline, no formal dependency CVE review process beyond Dependabot + manual `npm audit`.

For the vulnerability-disclosure process (what's in/out of scope for external reports), see the repo-root [SECURITY.md](../../SECURITY.md).
