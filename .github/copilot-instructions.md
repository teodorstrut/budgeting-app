# GitHub Copilot Instructions — Budgeting Ledger

This is a personal budgeting ledger mobile app built with React Native and Expo, targeting iOS and Android. Data is stored locally in an encrypted SQLite database. An optional Google Sheets sync lets users back up transactions and share a sheet with co-owners.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 55 / React Native 0.83.6 / React 19.2.0 |
| Language | TypeScript ~5.9.2 (strict mode) |
| Routing | Expo Router v3 — file-based, **Stack navigator only**, no tab navigator |
| Local DB | expo-sqlite ~55.0.15 — synchronous query API (`runSync`, `getAllSync`, `getFirstSync`) |
| Secure storage | expo-secure-store ~55.0.13 — OAuth tokens and secrets |
| Cloud sync | Google Sheets API v4 — OAuth PKCE flow via `expo-auth-session` |
| Background sync | expo-background-task + expo-task-manager |
| Icons | `@expo/vector-icons` FontAwesome — **sole icon library** |
| Charts | react-native-gifted-charts |
| Animations | react-native-reanimated |

---

## Folder Responsibilities

```
app/                    Route screens only — no business logic
services/               Pure business logic and API calls
database/
  schema.ts             Table definitions and seed data
  connection.ts         Async init, exports synchronous DB handle
  repositories/         Raw SQL — one file per domain (sync API)
components/
  ui/                   Atomic/shared widgets
  layout/               Structural chrome (Header, NavBar, MonthNavigator)
  data/                 TransactionList, TransactionItem
  charts/               DonutChart, SpendingBarChart
providers/              React Context (ThemeProvider)
theme/                  Design tokens (themes.ts) + shared styles (styles.ts)
constants/              Settings keys, static config
types/                  Shared TypeScript interfaces
utils/                  Pure helper functions (formatting, monthUtils, confirmDialog)
```

---

## Key Patterns

### Month period calculations — always respect `monthStartDay`

Billing periods are NOT calendar months. Always derive boundaries from `monthUtils`:

```ts
const day = settingsService.getMonthStartDay();        // synchronous — safe in useState initializers
const start = monthUtils.getCurrentMonthStart(day);    // "2026-05-15"
const end   = monthUtils.getCurrentMonthEnd(day);      // "2026-06-14"
```

Navigable screens (`history.tsx`, `reports.tsx`) hold `anchorMonth: Date` state initialised to the current **billing** period start, not the calendar month.

### Navigation

```ts
router.push('/add')
router.push({ pathname: '/add', params: { editId: String(id) } })
router.back()        // always use this to return — NEVER router.replace() for back navigation
```

`router.replace()` destroys the previous stack frame and resets state (e.g. month context). Only use it for intentional root-replacement flows.

### Screen data refresh

```ts
useFocusEffect(useCallback(() => {
  loadData();
}, [/* stable deps */]));
```

### Theming

```ts
const { theme } = useTheme();
const shared = useSharedStyles();
```

Always use `theme.colors.*`, `theme.spacing.*`, `theme.typography.*`. Never hardcode hex values for theme colours. Exception: semantic status colours not in the palette (e.g. `#ef4444` for over-budget red).

### Modal animation (280 ms slide-up + AnimatedBackdrop)

```ts
const translateY = useRef(new Animated.Value(600)).current;
const backdropOpacity = useRef(new Animated.Value(0)).current;

Animated.parallel([
  Animated.timing(translateY, { toValue: 0, duration: 280, useNativeDriver: true }),
  Animated.timing(backdropOpacity, { toValue: 0.5, duration: 280, useNativeDriver: true }),
]).start();
```

Pair every modal sheet with `<AnimatedBackdrop opacity={backdropOpacity} visible={...} onPress={closeModal} />`.

### Sync architecture

- A module-level `let isSyncing = false` guard in `syncService.ts` prevents concurrent calls
- Row format: `syncKey | ownerKey | note | type | category ("emoji name") | amount | date | updatedAt | deletedAt`
- Both full sync and incremental sync call `pullForeignRowsFromSheet()` after writing own rows
- `categorySyncService` uses a dedicated sheet tab: `Emoji | Category Name | Type | Budget`

### Foreign / multi-user transactions

Transactions and categories from co-owners of the same sheet are stored locally with `isReadOnly = 1` / `ownerKey != NULL`.

- `TransactionItem` receives `isForeign={item.isReadOnly === 1}` — muted styling, no press
- `TransactionList` passes `isForeign` automatically
- Screens use `<OwnershipToggle value={ownership} onChange={setOwnership} />` to filter `'mine' | 'all'`
- Muted colour tokens: `onSurfaceVariant` (dim text), `surfaceContainerHigh` (muted bg), `outlineVariant` (dim borders)

---

## Service Layer — Screens Call Services, Not Repositories

| Service | Responsibility |
|---|---|
| `transactionService` | CRUD, summaries, category spending, `getTransactionsForCategory` |
| `budgetService` | Budget health entries, category-budget joins |
| `settingsService` | Typed getters/setters for DB settings and secure store credentials |
| `syncService` | Google OAuth, Sheets API, sync orchestration, foreign row merge |
| `autoSyncService` | Background task registration, once-per-day guard |
| `categorySyncService` | Export/import categories+budgets to a separate Sheets tab |
| `googleSheetsUtils` | Shared: `authorizedFetch`, `parseErrorMessage`, `sanitizeForSheets` |

---

## Don'ts

- Do not add new icon libraries — FontAwesome via `@expo/vector-icons` only
- Do not introduce Redux, Zustand, Jotai, MobX or any external state library
- Do not call repositories directly from screens — go through services
- Do not use `router.replace()` for back navigation
- Do not hardcode theme hex values — use `theme.colors.*`
- Do not add features, refactor, or "improve" code beyond what is asked

---

## Current Version

v1.1 — see `budgeting-ledger/development-plan-1-1.md` (requirements) and `budgeting-ledger/development-plan-1-1-tech-details.md` (implementation plan).
