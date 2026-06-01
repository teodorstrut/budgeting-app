---
description: "Use when adding features, creating components, writing screens, modifying services, or working with the database in the budgeting-ledger app. Covers architecture layers, component library, theming, navigation, and established code practices to follow."
applyTo: "budgeting-ledger/**/*.{ts,tsx}"
---

# Budgeting Ledger — App Reference

## Stack & Versions

- **Expo SDK**: 55 (`expo` ^55.0.19)
- **React**: 19.2.0 / **React Native**: 0.83.6
- **TypeScript**: ~5.9.2
- **Expo Router**: ^55.0.13 (file-based routing, Stack navigation)
- **expo-sqlite** ~55.0.15 — local persistence (synchronous query API)
- **expo-secure-store** ~55.0.13 — encrypted key/value store (tokens, secrets)
- **expo-crypto** ~55.0.14 — UUID generation, cryptographic ops
- **react-native-gifted-charts** ^1.4.76 — bar + pie/donut charts
- **react-native-reanimated** 4.2.1 — animations
- **expo-auth-session** ^55.0.15 — Google OAuth (PKCE flow)
- **expo-background-task** / **expo-task-manager** — background auto-sync
- **@expo/vector-icons** ^15.0.3 — FontAwesome icons (sole icon library)

---

## Architecture Layers

```
SQLite (expo-sqlite, encrypted at rest on native via SQLCipher)
  └── database/schema.ts           — table definitions + default seed data
  └── database/connection.ts       — async init, exports synchronous DB API
  └── database/repositories/       — raw SQL, one file per domain
        transactionRepository
        categoryRepository
        budgetRepository
        syncConfigRepository
        syncDeletionRepository

services/                          — business logic, validation, aggregation
  transactionService               — CRUD, summaries, category spending, sync export
  budgetService                    — health analysis, category-budget joins
  settingsService                  — typed getters/setters for all app settings
  syncService                      — OAuth tokens, Google Sheets API calls, sync ops
  autoSyncService                  — background task registration, daily auto-sync

providers/ThemeProvider.tsx        — React Context for light/dark theme, persisted to DB
theme/themes.ts                    — design tokens (colors, spacing, typography, radii)
theme/styles.ts                    — useSharedStyles() hook returning pre-built style objects

components/                        — all reusable UI; always check here before writing new code
  ui/           — atomic/shared widgets
  layout/       — structural chrome (Header, NavBar, MonthNavigator, AddTransactionButton)
  data/         — TransactionList, TransactionItem
  charts/       — DonutChart, SpendingBarChart

app/                               — screens only (Expo Router routes)
  index.tsx           — Dashboard / Ledger home
  add.tsx             — Add / Edit transaction
  history.tsx         — Transaction history & search
  budgets.tsx         — Budget management
  reports.tsx         — Analytics & charts
  budget-health.tsx   — Detailed budget vs. actual
  manage-categories.tsx
  settings.tsx
  sync-settings.tsx   — Google Sheets configuration
  bill-splitter.tsx   — Multi-category expense split
```

---

## Theming — Always Use Hooks, Never Hardcode Theme Colors

```ts
const { theme, colorScheme, setColorScheme } = useTheme()
const shared = useSharedStyles()
```

- `theme.colors.*` — full palette: `surface`, `surfaceContainer*`, `primary`, `primaryContainer`, `onPrimary`, `secondary`, `onSecondary`, `tertiary`, `tertiaryContainer`, `onSurface`, `onSurfaceVariant`, `outline`, `outlineVariant`
- `theme.spacing.*` — `xs`(4) `sm`(8) `md`(16) `lg`(24) `xl`(32) `xxl`(48)
- `theme.typography.*` — `displayLg` → `labelMd` scale, PlusJakartaSans family
- `shared.containers.*`, `shared.text.*`, `shared.card.*`, `shared.inputs.*`, etc.

**Never** use hardcoded hex values for theme colors. Use `theme.colors.*` so light/dark switching works automatically.

Exception: semantic status colors that are **not** part of the theme palette — such as `#ef4444` for over-budget red — are acceptable.

---

## Component Library — Reuse Before Creating

Always check `components/` before building something new. Everything here already exists and is tested.

### `components/ui/`

| Component | Key Props | Where It Is Used |
|---|---|---|
| `Card` | `children`, `style?` | wraps most content sections |
| `EmptyState` | `title`, `subtitle?`, `icon?` | no-data states across all screens |
| `SummaryTile` | `title`, `value: string`, `color?` | index.tsx income/expense tiles |
| `ToggleButtonGroup<T>` | `options[]`, `selected`, `onSelect`, `activeColor`, `activeTextColor`, `inactiveTextColor`, `borderColor` | income/expense toggles, dark/light toggle |
| `AppTextInput` | extends `TextInputProps`, `containerStyle?` | all text inputs (forwardRef for `.focus()`) |
| `AppInputLabel` | `children`, `style?` | labels above form fields |
| `AppSelectorField` | extends `TouchableOpacityProps`, `children` | tappable selector rows (category, date/time, amount) |
| `CalculatorKeypad` | `visible`, `initialValue`, `onConfirm`, `onDismiss`, `onHeightChange?` | amount entry in add.tsx, budgets.tsx, bill-splitter.tsx |
| `CategoryPickerModal` | `visible`, `onClose`, `categories[]`, `onSelectCategory`, `selectedCategoryId?`, `title?`, `emptyMessage?`, `onManageCategories?`, `showAllOption?`, `onSelectAll?` | category selection everywhere |
| `ProgressBar` | `progress` (0–1), `height?`, `color`, `trackColor`, `style?` | budget health ratios |
| `BudgetHealthWidget` | `entries: BudgetHealthEntry[]` | index.tsx dashboard; links to /budget-health |
| `AnimatedBackdrop` | `opacity: Animated.Value`, `visible`, `onPress` | shared by all modals and the CalculatorKeypad |
| `MonthStartDayPicker` | — | settings.tsx |
| `TransactionDateTimeField` | — | add.tsx, bill-splitter.tsx |
| `SplitSlider` | — | bill-splitter.tsx step 2 |

### `components/layout/`

| Component | Key Props | Where It Is Used |
|---|---|---|
| `Header` | `title`, `showBackButton?`, `onBackPress?`, `rightIconName?`, `onRightPress?`, `titleColor?`, `containerStyle?`, `titleStyle?` | screens without bottom NavBar |
| `NavBar` | — (reads pathname internally via `usePathname`) | index, history, reports, budgets, budget-health |
| `MonthNavigator` | `label: string`, `onPrevious`, `onNext` | history.tsx, reports.tsx |
| `AddTransactionButton` | — | all screens that include NavBar |

### `components/data/`

| Component | Key Props | Where It Is Used |
|---|---|---|
| `TransactionList` | `transactions[]`, `title?`, `onTransactionPress?`, `dateDisplayMode?` | index.tsx, history.tsx |
| `TransactionItem` | `transaction`, `categoryEmoji?`, `categoryName?`, `onPress?`, `dateDisplayMode?` | rendered inside TransactionList |

### `components/charts/`

| Component | Key Props | Where It Is Used |
|---|---|---|
| `DonutChart` | `data: DonutSlice[]`, `totalLabel`, `totalValue`, `size?` | reports.tsx expense/income breakdown |
| `SpendingBarChart` | `data: BarDataPoint[]` | reports.tsx 7-month evolution |

---

## Service Layer — Screens Call Services, Not Repositories

Screens always interact with **services**. Repositories are only called from within services.

| Service | Responsibility |
|---|---|
| `transactionService` | CRUD, validation, month summaries, category spending, sync export rows |
| `budgetService` | budget health entries, category-budget joins, upsert/deleteAll |
| `settingsService` | typed getters/setters for all app settings (DB-backed) and secure store (credentials) |
| `syncService` | OAuth token management, Google Sheets API, spreadsheet operations, sync logic |
| `autoSyncService` | background task registration, once-per-day auto-sync guard |

---

## Repository Pattern

- Repositories expose a **synchronous** API: `runSync`, `getAllSync`, `getFirstSync`, `execSync`
- The DB connection is initialized **asynchronously once** in `app/_layout.tsx`; screens render only after `dbReady` is true
- Repositories do **no validation** — validation belongs in services
- Use `INSERT OR REPLACE` (upsert) for settings and budgets; explicit `INSERT`/`UPDATE` for transactions and categories

---

## Navigation — Expo Router

```ts
router.push('/add')
router.push({ pathname: '/add', params: { editId: String(id) } })
router.replace('/history')
router.back()
```

- Route files live **only** in `app/`; no business logic beyond screen orchestration
- Params are serialized to strings by Expo Router — parse numbers with `Number(params.editId)`
- Use `useFocusEffect(useCallback(() => { /* load data */ }, [deps]))` to refresh data when a screen gains focus

---

## Month Period Pattern — Always Respect `monthStartDay`

Billing periods are **not** calendar months. Derive all period boundaries from `monthUtils`:

```ts
const monthStartDay = settingsService.getMonthStartDay()   // 1–28, default 1
const start = monthUtils.getCurrentMonthStart(monthStartDay)  // e.g. "2026-05-15"
const end   = monthUtils.getCurrentMonthEnd(monthStartDay)    // e.g. "2026-06-14"
```

- Screens with navigable months hold `anchorMonth: Date` state
- Derive period boundaries via `monthUtils.getMonthPeriodForDate(monthStartDay, anchorMonth)`
- Always load `monthStartDay` from `settingsService` on mount / focus, not as a static import

---

## Established Code Practices — Keep These

### 1. Screen Scaffold

```ts
export default function ScreenName() {
  const { theme } = useTheme()
  const shared = useSharedStyles()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  // local state
  useFocusEffect(useCallback(() => { /* load data */ }, [/* deps */]))
  // JSX
}
```

### 2. Modal Animation (280 ms slide-up + AnimatedBackdrop)

```ts
const translateY = useRef(new Animated.Value(600)).current
const backdropOpacity = useRef(new Animated.Value(0)).current

useEffect(() => {
  Animated.parallel([
    Animated.timing(translateY, { toValue: visible ? 0 : 600, duration: 280, useNativeDriver: true }),
    Animated.timing(backdropOpacity, { toValue: visible ? 0.5 : 0, duration: 280, useNativeDriver: true }),
  ]).start()
}, [visible])
```

Pair every modal with `AnimatedBackdrop`.

### 3. Destructive Actions Need Confirmation

```ts
import { confirmDialog } from '@/utils/confirmDialog'

confirmDialog('Delete Transaction', 'This cannot be undone.', () => {
  transactionService.deleteTransaction(id)
  router.back()
})
```

### 4. Amount & Date Formatting

```ts
import { formatAmount, formatRelativeDate, formatTime } from '@/utils/formatting'

formatAmount(250, 'expense')     // "-$250.00"
formatAmount(100, 'income')      // "+$100.00"
formatRelativeDate(isoString)    // "3 hours ago"
formatTime(isoString)            // "2:30 PM"
```

### 5. Settings Access

```ts
import { SETTING_KEYS, SECURE_KEYS } from '@/constants/settings'

// DB-backed (sync)
settingsService.getMonthStartDay()
settingsService.getBooleanSetting(SETTING_KEYS.GOOGLE_AUTO_SYNC_ENABLED, true)
settingsService.setSetting(SETTING_KEYS.THEME, 'dark')

// Secure store (async, for credentials)
await settingsService.getGoogleAccountEmail()
await settingsService.setGoogleAccountEmail(email)
```

### 6. Budget Status Color Coding

- Healthy (< 80% spent): `theme.colors.primary`
- Warning (≥ 80% spent): `theme.colors.secondary`
- Over budget (> 100%): `#ef4444`

### 7. Icons — FontAwesome Only

Use `@expo/vector-icons` FontAwesome:

```tsx
import { FontAwesome } from '@expo/vector-icons'
<FontAwesome name="bar-chart" size={20} color={theme.colors.onSurface} />
```

Do not add new icon libraries.

### 8. State Management — React Only

State is managed with `useState` and `useContext` only. Do not introduce Redux, Zustand, Jotai, MobX, or any other state library.

### 9. Database Security

- The SQLCipher encryption key is generated once on first launch and stored in `expo-secure-store`; never log or expose it
- Never log tokens, refresh tokens, or user credentials anywhere
- Always call `syncService.sanitizeForSheets(value)` before writing user-supplied strings to Google Sheets (prevents formula injection)

---

## Database Schema — Tables at a Glance

| Table | Purpose | Notable Columns |
|---|---|---|
| `categories` | Category definitions | `id`, `emoji`, `name`, `type` ('income'\|'expense') |
| `transactions` | Financial entries | `id`, `amount`, `type`, `categoryId` (FK), `note`, `date` (ISO), `createdAt`, `updatedAt` |
| `budgets` | Per-category monthly limits | `id`, `categoryId` (FK UNIQUE), `amount` |
| `settings` | App-wide KV store | `id`, `key` (UNIQUE), `value` |
| `sync_configs` | Google Sheets sync state | `provider`, `spreadsheetId`, `sheetName`, `lastSync`, `status` |
| `sync_deletions` | Tombstones for deleted transactions | `transactionId` (PK), `deletedAt` |

---

## Key File Reference

| Concern | Path |
|---|---|
| App shell + DB init | `app/_layout.tsx` |
| DB schema & seed | `database/schema.ts` |
| DB connection | `database/connection.ts` |
| Design tokens | `theme/themes.ts` |
| Shared styles hook | `theme/styles.ts` |
| Theme context + hook | `providers/ThemeProvider.tsx` |
| Setting key constants | `constants/settings.ts` |
| Month period utilities | `utils/monthUtils.ts` |
| Formatting utilities | `utils/formatting.ts` |
| Confirm dialog helper | `utils/confirmDialog.ts` |
| Theme types | `types/theme.ts` |
| Sync types | `types/sync.ts` |
