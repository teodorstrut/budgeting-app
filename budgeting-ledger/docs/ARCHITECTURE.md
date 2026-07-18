# Architecture

System-level map of the app. For schema/API detail see [TECHNICAL.md](./TECHNICAL.md); for what each screen does see [FUNCTIONAL.md](./FUNCTIONAL.md); for non-obvious constraints see [GOTCHAS.md](./GOTCHAS.md); for a manual verification checklist see [MANUAL_TESTING.md](./MANUAL_TESTING.md).

## What this is

A personal budgeting ledger — a React Native / Expo app (iOS + Android, with a degraded static-web build) that stores transactions, categories, and budgets in a local encrypted SQLite database. There is no backend server. An optional Google Sheets integration lets a user back up their data and share a spreadsheet with a co-owner for a lightweight, read-only "multi-user" view.

## Tech stack

| Layer | Technology | Version (`package.json`) |
|---|---|---|
| Framework | Expo | `^56.0.8` |
| Native runtime | React Native | `0.85.3` |
| UI runtime | React | `19.2.3` |
| Language | TypeScript (strict) | `~6.0.3` |
| Routing | Expo Router (file-based, Stack navigator only, no tabs) | `~56.2.8` |
| Local DB | `expo-sqlite`, synchronous API, SQLCipher-encrypted | `~56.0.4` |
| Secure storage | `expo-secure-store` (OAuth tokens, DB encryption key) | `~56.0.4` |
| Cloud sync | Google Sheets API v4 + Drive API v3 (REST, no SDK) | — |
| OAuth | `expo-auth-session` (Google provider, PKCE) | `~56.0.13` |
| Background sync | `expo-background-task` + `expo-task-manager` | `~56.0.16` |
| Crypto | `expo-crypto` (UUID / random key generation) | `~56.0.4` |
| Charts | `react-native-gifted-charts` | `^1.4.76` |
| Animation | `react-native-reanimated` + `react-native-worklets` | `4.3.1` / `0.8.3` |
| Icons | `@expo/vector-icons`, FontAweome only (project convention) | `^15.0.3` |
| Web build | `react-native-web` (static output, degraded/demo mode) | `~0.21.0` |
| State management | None — plain `useState`/`useContext` only. Redux/Zustand/Jotai/MobX are intentionally not used. | — |

No test framework, no CI pipeline currently exist in the repo.

## Layered architecture

```
app/*.tsx                    Expo Router screens — routing + orchestration only, no business logic
   │  calls
   ▼
services/*.ts                Business logic: validation, aggregation, sync orchestration
   │  calls
   ▼
database/repositories/*.ts   Raw parameterized SQL, one file per table
   │  calls
   ▼
database/connection.ts       Synchronous expo-sqlite handle (SQLCipher-encrypted)
```

Screens never call repositories directly — they always go through the service layer (the one exception is `settingsService.ts` and `providers/ThemeProvider.tsx`, which read/write the generic `settings` table directly since there's no dedicated repository for it).

There is no shared data cache/store. Each screen fetches its own data in a `useFocusEffect` and holds it in local `useState`; after a mutation, screens simply re-run their own fetch.

## Folder responsibilities

```
budgeting-ledger/
├── app/                     Expo Router routes — one file per screen (see FUNCTIONAL.md)
├── components/
│   ├── ui/                  Atomic/shared widgets (inputs, modals, calculator, cards, toggles)
│   ├── layout/               Header, NavBar, MonthNavigator, AddTransactionButton
│   ├── data/                 TransactionList, TransactionItem
│   └── charts/                DonutChart, SpendingBarChart
├── database/
│   ├── connection.ts         Async DB init → exports a synchronous db handle
│   ├── schema.ts              Table DDL, idempotent migrations, seed data, reset/reseed
│   └── repositories/          One raw-SQL file per table
├── services/                  Business logic layer — screens call these, never repositories
├── providers/ThemeProvider.tsx   React Context for light/dark theme, persisted to the settings table
├── theme/                      themes.ts (design tokens) + styles.ts (useSharedStyles hook)
├── types/                      sync.ts, theme.ts — shared TS interfaces
├── constants/settings.ts       SETTING_KEYS / SECURE_KEYS constants
├── utils/                       formatting.ts, monthUtils.ts (billing-period math), confirmDialog.ts
├── config/android/              Hand-authored XML consumed by app.config.js's config plugins
├── docs/                        You are here — ARCHITECTURE/TECHNICAL/FUNCTIONAL/DEVELOPMENT_HISTORY/GOTCHAS/MANUAL_TESTING
├── mdfiles/app-description.md   Original informal product/tech brief (source material, not documentation)
├── assets/                       Icons, splash, store images
├── app.config.js                 Dynamic Expo config
├── eas.json, tsconfig.json, eslint.config.js
```

No native `android/`/`ios/` folders are currently checked in — the app runs on the Expo **managed** workflow (native projects are generated on demand via `expo prebuild`).

## App startup sequence

1. `app/_layout.tsx` (`RootLayout`) mounts, calls `SplashScreen.preventAutoHideAsync()`.
2. It dynamically imports and awaits `database/connection.ts`'s `initDbConnection()` — opens `budgeting.db` via `expo-sqlite`, generates/loads the SQLCipher key from `expo-secure-store`, applies `PRAGMA key`, then `PRAGMA foreign_keys = ON`.
3. It then awaits `database/schema.ts`'s `initDatabase()` — runs idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE` migrations, then seeds default categories if the table is empty.
4. Only after both resolve does `dbReady` flip to `true` and the splash screen hides; screens render behind a `GestureHandlerRootView` → `ThemeProvider` → themed `<Stack headerShown={false}>`.
5. Background sync is registered (`autoSyncService.registerBackgroundAutoSync()`) and an `AppState` listener triggers a sync check on every foreground transition.

On `Platform.OS === 'web'`, the DB handle is swapped for an in-memory no-op mock — the web build has no real persistence (demo mode only).

## Where sync fits in

The Google Sheets sync layer sits beside the service layer, not inside the core CRUD path — `services/syncService.ts` (transactions) and `services/categorySyncService.ts` (categories/budgets) read from and write to the same repositories that screens use, but run independently, triggered by:
- a manual "Sync Now" action in `app/sync-settings.tsx`,
- a 15-minute-interval background task (`expo-background-task`), gated to run at most once per local calendar day after 2 AM,
- an `AppState` foreground listener.

See [TECHNICAL.md § Sync mechanism](./TECHNICAL.md#google-sheets-sync-mechanism) for the detailed protocol.

## Theming

`providers/ThemeProvider.tsx` exposes a `ThemeContext` (`useTheme()`) for light/dark mode, backed by `theme/themes.ts` design tokens and a `theme/styles.ts` `useSharedStyles()` hook. The current mode is persisted directly to the `settings` table. Screens must use `theme.colors.*` / `theme.spacing.*` / `theme.typography.*` — hardcoded hex values are a convention violation, except for semantic status colors not in the palette (e.g. `#ef4444` for "over budget").
