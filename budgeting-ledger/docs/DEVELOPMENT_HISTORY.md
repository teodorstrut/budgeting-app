# Development History

Historical record of what shipped in past milestones. **This is not current-state documentation** — for that, see [ARCHITECTURE.md](./ARCHITECTURE.md), [TECHNICAL.md](./TECHNICAL.md), and [FUNCTIONAL.md](./FUNCTIONAL.md). This file condenses the original `development-plan.md`, `development-plan-1-1.md`, and `development-plan-1-1-tech-details.md` (superseded and removed) so the history isn't lost.

## v1.0 — Initial build

Original plan: React Native/Expo app with a `mint_honey_night` light/dark design system, SQLite persistence, and a component library organized by domain. Planned phases:

1. **Foundation** — Expo + TypeScript + ESLint/Prettier, theming, SQLite schema, repository + service layers.
2. **Screens** — Dashboard, Add Transaction, History, Bill Splitter, Settings, Budgets — one phase each.
3. **Reporting & charts** — donut/pie breakdown, bar chart trend, category totals, budget overlays.
4. **Google Sheets connectivity** — OAuth sign-in, sheet selection/creation, automatic row push, sync status/conflict handling.
5. **Polish & quality** — accessibility, localization, offline resilience, E2E/unit tests (Detox/Playwright, Jest + RNTL), CI pipeline.

Phase 5 (tests, CI, accessibility polish, localization) was never implemented — the codebase currently has no automated tests and no CI workflow. Everything else shipped, largely matching the plan, though the actual folder structure and component names diverged somewhat from the original sketch (e.g. no `hooks/` or `styles/` top-level folders; components ended up under `components/ui|layout|data|charts/` rather than `components/ui|navigation|forms|data|charts|modals/`).

## v1.1 — Bug fixes + multi-user sharing

### Bugs fixed

| Bug | Root cause | Fix |
|---|---|---|
| Back navigation from Add/Edit lost the currently-viewed month in History | `add.tsx` used `router.replace('/history')`, which destroys and remounts the History screen, resetting its `anchorMonth` state | Switched to `router.back()`, which preserves the existing stack frame and its state |
| Native keyboard and the custom calculator keypad could both be open at once in Add Transaction | No cross-dismiss coordination between the Note text field and the Amount field's calculator overlay | `Keyboard.dismiss()` before opening the calculator; opening the Note field closes the calculator |
| Auto-sync (2 AM background task) occasionally duplicated transactions in the sheet | Race condition — the background task and the foreground `AppState` trigger could both pass the "should I sync" guard and run concurrently, each appending the same new rows; separately, the deleted-row tombstone was missing its "Deleted At" column value | Added a module-level `isSyncing` guard in `syncService.ts` so only one sync runs at a time; fixed the tombstone row to include all 9 columns |
| History and Reports opened on the wrong period when `monthStartDay` wasn't the 1st | Both screens initialized `anchorMonth` from `new Date()` (the calendar month) instead of the current billing period | Initialize `anchorMonth` from `monthUtils.getCurrentMonthStart(monthStartDay)`; added a "has the user manually navigated" guard so a later re-render doesn't yank them back to the current period |

### Features added

- **Reports category drilldown** — tapping a category in "All Categories" opens a modal listing that category's transactions for the period (`CategoryTransactionsModal`, `transactionService.getTransactionsForCategory`).
- **Category & budget sync** — export/import categories and their budgets to a dedicated Google Sheets tab, independent of the transaction-sync sheet; dedup by emoji + lowercase name, highest-budget-wins on import (`categorySyncService.ts`).
- **Read-only foreign transactions** ("multi-user via shared spreadsheet") — the largest feature of v1.1. Added `ownerKey`/`isReadOnly` to `transactions` and `ownerKey`/`isAdopted` to `categories` via idempotent migrations; sync now pulls other owners' rows from the shared sheet and stores them locally as read-only; added the "Mine/All" `OwnershipToggle`, muted styling for foreign `TransactionItem`s, and a "From Other Users" adoption flow in Manage Categories.

All of the above is current, shipped behavior — see [FUNCTIONAL.md](./FUNCTIONAL.md) for the user-facing description and [TECHNICAL.md](./TECHNICAL.md) for the implementation detail.

## Source material

`mdfiles/app-description.md` (kept in the repo) has the original informal product/technical brief that both plans were based on.
