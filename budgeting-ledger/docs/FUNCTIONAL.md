# Functional Documentation

What the app does, from a product/user perspective. For how it's built see [ARCHITECTURE.md](./ARCHITECTURE.md) and [TECHNICAL.md](./TECHNICAL.md); for a per-screen manual verification checklist see [MANUAL_TESTING.md](./MANUAL_TESTING.md).

## What it is

A free, personal budget tracker for iOS and Android. Data lives on-device by default (no account required, works fully offline); Google Sheets sync is optional, for backup and for lightweight sharing with a co-owner. No subscriptions, ads, or telemetry.

## Screens

| Screen | Route | Purpose |
|---|---|---|
| Dashboard | `app/index.tsx` | Home screen — current billing-period balance, income/expense totals, budget health summary widget, recent transactions |
| Add / Edit Transaction | `app/add.tsx` | Create or edit a single income/expense transaction: calculator-style keypad for amount, category picker, date/time field, note |
| History | `app/history.tsx` | Browse past billing periods, search by note/amount/category, transactions grouped by date, month navigation |
| Budgets | `app/budgets.tsx` | Set/edit a monthly spending limit per category |
| Budget Health | `app/budget-health.tsx` | Detailed budget-vs-actual per category, with progress bars |
| Reports | `app/reports.tsx` | Donut chart, "All Categories" list, and bar chart trend — all driven by one Expense/Income toggle; tap a category to drill into its transactions for the period |
| Manage Categories | `app/manage-categories.tsx` | Create/edit/delete categories (emoji + name + income/expense); adopt categories shared by other users |
| Settings | `app/settings.tsx` | Theme (light/dark), month-start-day configuration, links to category management and sync settings |
| Sync Settings | `app/sync-settings.tsx` | Connect/disconnect Google account, choose spreadsheet + tab for transaction sync and for category/budget sync, manual "Sync Now", sync status |
| Bill Splitter | `app/bill-splitter.tsx` | Split one bill across multiple categories by percentage or amount, saving each split as its own transaction |
| OAuth redirect | `app/oauthredirect.tsx` | Landing route for the Google sign-in redirect; not user-facing |

## Core business rules

### Billing periods, not calendar months

A user can set a custom **month-start day** (1–28, default 1) in Settings — e.g. if their pay cycle starts on the 15th. Every "monthly" view (Dashboard, History, Reports, Budgets, Budget Health) computes its period boundaries from this setting rather than the calendar month. History and Reports let the user navigate to a previous/next period; on (re)opening, they anchor to the *current billing period*, not the calendar month — so if today is June 1 and the start day is 15, the period shown is May 15–June 14.

### Budgets

One optional monthly budget per category. Budget Health and the Dashboard widget compare period-to-date spending against the budget and color-code the result (healthy under ~80%, warning at ~80%+, over budget past 100%).

### Reports & category drilldown

Reports has three cards, all driven by a single Expense/Income toggle at the top ("Monthly Spending"):
- A **donut chart** — category breakdown for the period, for whichever type is selected.
- An **"All Categories" list** — spend-vs-budget per category (with a progress bar) when Expenses is selected, since budgets only apply to expenses; income totals per category (no budget/progress bar) when Income is selected.
- A **"Spending Evolution" bar chart** — trend across several periods, with its own category-filter picker that also switches between expense and income categories depending on the toggle; switching the toggle resets the filter back to "All Categories".

Tapping a category in "All Categories" opens a slide-up modal listing every transaction in that category for the period, with the total shown as `+` (income) or `-` (expense) to match.

### Bill Splitter

Lets a user divide one purchase (e.g. a shared grocery run) across multiple categories, either by percentage or by exact amount per slice, then commits each slice as its own transaction.

### Google Sheets sync (optional)

A user can connect a Google account (OAuth) and pick a spreadsheet + tab to back up their transactions to, and separately, a spreadsheet + tab to sync categories/budgets. Sync can be run manually or happens automatically once per day in the background. This is a backup/sharing mechanism, not a login system — the app itself has no accounts.

### Sharing a spreadsheet between two users ("multi-user")

There's no real multi-user auth. Instead, each install has a random per-device identifier. If two people point their apps at the *same* spreadsheet:
- Each person's own transactions/categories are written under their own identifier and are always editable by them.
- The other person's transactions/categories are pulled in locally as **read-only** — shown with muted/greyed styling and a small icon, and excluded from edits/deletes. A "Mine / All" toggle (present on Dashboard and History whenever any foreign transaction exists) switches between seeing only your own data or everyone's.
- Foreign categories show up in a "From Other Users" section in Manage Categories; a user can **Adopt** one to make it their own going forward (matched to an existing category of theirs by emoji + case-insensitive name, if one exists, otherwise created as a new owned copy).
- Category/budget sync deduplicates rows across users by emoji + case-insensitive name — if both users have "Groceries" with the same emoji, it's treated as one row in the sheet. Where both users have set a budget for the same (deduplicated) category, the higher amount wins on import.
- Deletions are respected: a transaction deleted on one device is marked deleted in the sheet and removed from the other device on its next sync, rather than reappearing.

## Screens NOT present

There is no login/account screen (Google OAuth in Sync Settings authorizes Sheets access only, not app access), no multi-account switcher, and no onboarding flow beyond the default seeded categories on first launch.
