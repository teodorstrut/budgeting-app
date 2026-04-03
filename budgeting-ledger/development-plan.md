# Budgeting Ledger App - Development Plan

## Overview
This document is the authoritative development plan for the Budgeting Ledger mobile app, a personal finance tracker built with React Native and Expo.

The app supports local data persistence with SQLite, a clean reusable component system driven by the design language in `design/mint_honey_night`, and advanced features including Google Sheets sync and charts.

## Updated Design System Alignment
- Theme: `mint_honey_night` with light/dark mode support.
- Color scheme: high contrast surfaces and soft highlights, with glassmorphism-inspired cards.
- Typography: consistent usage of variable fonts, e.g., `Plus Jakarta Sans` or equivalent.
- UI: pill-shaped badges, virtual depth layering, and emphasis on affordance with no-border containers.
- Layout: modular screens in `/app`, each mapped to a functional domain (dashboard, ledger, split, growth, reports, settings).

## Core Requirements (from app-description)
- Local persistence (SQLite) with relational schema.
- Transaction CRUD, category management, budgets, monthly history, and detailed reporting.
- Charting: pie chart, bar chart, totals sorted by category.
- Settings: theme switch, month-start-day, category and budget management.
- Google Sheets sync: account connect, sheet selection, create sheet/page, automatic row push.

## Reusable Components (based on design and updated requirements)
- Navigation: `TopAppBar`, `BottomNavBar`, `FAB`, `TabBar`
- Layout: `SurfaceCard`, `SectionHeader`, `Grid`, `Spacer`
- Inputs: `AmountInput`, `TextInput`, `DateTimePicker`, `SelectDropdown`, `CategoryGrid`, `Switch`
- Data display: `TransactionItem`, `TransactionList`, `BudgetCard`, `SummaryTile`, `ChartCard`
- Charts: `PieChart`, `BarChart`, `ProgressRing`, `Sparkline`
- Modals: `TransactionModal`, `CategoryModal`, `ConfirmDialog`, `SyncStatusDialog`
- Utility: `LoadingOverlay`, `EmptyState`, `ErrorView`

## Folder Structure (confirmed, improved with semantics)

```
budgeting-ledger/
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── ledger/index.tsx
│   │   ├── split/index.tsx
│   │   ├── growth/index.tsx
│   │   └── reports/index.tsx
│   ├── add-transaction.tsx
│   ├── settings.tsx
│   ├── categories.tsx
│   └── sync.tsx
├── components/
│   ├── ui/
│   ├── navigation/
│   ├── forms/
│   ├── data/
│   ├── charts/
│   └── modals/
├── database/
│   ├── schema.ts
│   ├── migrations/
│   ├── repositories/
│   └── connection.ts
├── hooks/
├── services/
│   ├── transactionService.ts
│   ├── budgetService.ts
│   ├── categoryService.ts
│   ├── syncService.ts
│   ├── reportService.ts
│   └── chartService.ts
├── styles/
├── types/
├── constants/
├── assets/
└── utils/
```

## TypeScript Types
- `User`: id, name, email, avatar, theme, monthStartDay
- `Category`: id, emoji, name, type, color, budget
- `Transaction`: id, amount, type, categoryId, name, note, date, createdAt, updatedAt
- `Budget`: id, categoryId, amount, period, startDate
- `SheetSyncConfig`: provider, spreadsheetId, sheetName, lastSync, status
- `ChartData`: labels/datasets for pie/bar

## Development Plan by Phase

### Phase 1: Foundation
1. Initialize Expo + TypeScript + ESLint + Prettier.
2. Set up theming (+light/dark) and global style constants.
3. Implement design tokens from `design/mint_honey_night`.
4. SQLite integration via `expo-sqlite`; create schema (transactions, categories, budgets, settings, sync state).
5. Create repository interfaces and service layer.

### Phase 2: Core Features
1. Transactions: add/edit/delete, category assign, date/time, notes.
2. Category management: CRUD with emoji/name/type and color.
3. Budget management: per category assignment, total incomes vs expenses.
4. History view: filter by month, year; month boundary based on monthStartDay.
5. Sync settings: Google sign-in, sheet select/create, status pages.

### Phase 3: Reporting
1. Pie chart: expense/income breakdown by category.
2. Bar chart: monthly evolution, optional budget overlay toggle.
3. Totals sorted by category for selected month.
4. Budget progress visuals + alerts on overages.

### Phase 4: Polish & Quality
1. Accessibility + keyboard navigation + screen reader labels.
2. Localization hooks (currency, date formats).
3. Offline/resume resilience + syncing queue.
4. E2E tests (Detox/Playwright), unit tests (Jest + React Native Testing Library).
5. CI pipeline and release scripts.

## Immediate next steps
- Review `design/mint_honey_night` screens and map each to a minimal component backlog.
- Start building the database schema and models in `database/schema.ts`.
- Scaffold core screens in `app/(tabs)`.

