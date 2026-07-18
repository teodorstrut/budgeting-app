# Manual Testing Checklist

There is no automated test suite or CI in this repo (see [TECHNICAL.md § Security posture](./TECHNICAL.md#security-posture)) — verification means actually running the app and exercising the flow. This is a per-screen checklist of what's worth tapping through after a change, not an exhaustive QA script: run the golden path for whatever screen you touched, plus the edge cases listed for it. See [GOTCHAS.md](./GOTCHAS.md) for *why* several of these edge cases exist.

## Cross-cutting (worth a quick pass regardless of which screen you touched)

- Both light and dark theme (`Settings` toggle).
- A non-default **month-start-day** (e.g. 15), not just the default (1) — most screens compute billing periods from it.
- With at least one **foreign/read-only transaction or category** present, if the change touches anything sync-adjacent, sharing, or the "Mine/All" toggle.
- Kill and reopen the app after the change, to confirm SQLite persistence and that `dbReady`/theme/settings still initialize correctly.

## Dashboard (`app/index.tsx`)

- Current billing-period balance, income total, and expense total match a known set of transactions.
- Budget health summary widget appears when budgets are configured, and is absent/empty when none are.
- Add/edit/delete a transaction elsewhere, return to Dashboard, confirm totals refresh (`useFocusEffect`).
- "Mine/All" toggle (only visible when a foreign transaction exists) filters totals and the recent-transactions list correctly.

## Add / Edit Transaction (`app/add.tsx`)

- Create an expense and an income transaction; edit an existing one (via History or Reports drilldown → edit).
- Calculator keypad and the native keyboard don't fight: open the Note field while the calculator is open (calculator should close), and vice versa.
- After editing, `router.back()` returns to History/Reports with the previously-viewed month still selected (not reset to current period).
- Change a transaction's date to a different billing period and confirm it moves to the correct period's totals everywhere (Dashboard, History, Reports, Budget Health).

## History (`app/history.tsx`)

- Navigate to the previous/next billing period; search by note, amount, and category.
- Open History when `monthStartDay` isn't 1 — it should anchor to the *current billing period*, not the calendar month.
- Manually navigate to a different period, background/foreground the app (or switch tabs and back) — it should **not** snap back to the current period.
- "Mine/All" toggle appears only when a foreign transaction exists in the visible range, and filters correctly.

## Budgets (`app/budgets.tsx`)

- Set a budget on a category, edit it, and clear it (set to 0).
- Open the category picker, close it, then tap into the amount field — the calculator should open correctly despite the 300ms close-animation delay ([GOTCHAS.md](./GOTCHAS.md#ui--animation)).
- Confirm budgets only apply to expense categories (no budget option/effect on income categories).

## Budget Health (`app/budget-health.tsx`)

- Progress bar colors: healthy (under ~80%), warning (~80%+), over-budget (past 100%, red).
- Add a transaction dated on the **very last day** of the current billing period and confirm it's actually counted here — this is a known edge case ([GOTCHAS.md](./GOTCHAS.md#database)) worth re-checking after any date/period-related change.

## Reports (`app/reports.tsx`)

- Toggle Expenses/Income in "Monthly Spending" and confirm all three cards follow it:
  - Donut chart breakdown switches type.
  - "All Categories" switches between spend-vs-budget (with progress bars) and income-per-category totals (no progress bar), with correct empty-state text.
  - "Spending Evolution"'s category picker lists the matching category type, and switching the toggle resets the filter back to "All Categories".
- Tap a category row and confirm the drilldown modal opens with the right sign (`+` income / `-` expense) and transaction list.
- With both short and long category names present, confirm the amount/budget text and chevron stay flush against the right edge on every row (not scattered by name length).
- Navigate to a previous period and confirm the bar chart remounts with fresh data (no stale bars from the prior filter/period).

## Manage Categories (`app/manage-categories.tsx`)

- Create, edit, and delete a category (emoji + name + income/expense type).
- With a shared spreadsheet connected and a foreign category present, confirm it shows under "From Other Users" and that **Adopt** either merges into an existing matching category (same emoji + case-insensitive name) or creates a new owned copy.
- Delete a category that has existing transactions and confirm those transactions behave sensibly (not silently orphaned in a way that crashes a screen).

## Settings (`app/settings.tsx`)

- Toggle theme light/dark and confirm it persists across an app restart.
- Change month-start-day (including the boundary values 1 and 28) and confirm Dashboard, History, Reports, Budgets, and Budget Health all re-anchor to the new period definition.

## Sync Settings (`app/sync-settings.tsx`)

- Connect a Google account, pick a spreadsheet + tab for transaction sync, pick one separately for category/budget sync, run "Sync Now" manually, then disconnect.
- Confirm OAuth sign-in is disabled (with reasonable messaging) when running in Expo Go, and works from a dev/preview build.
- With two devices/installs pointed at the same spreadsheet, confirm each one's own rows stay editable and the other's show up read-only (muted styling, no edit/delete).
- Delete a transaction and confirm it disappears from the sheet (tombstoned) and from the other device on its next sync, rather than reappearing.

## Bill Splitter (`app/bill-splitter.tsx`)

- Split one bill across multiple categories by percentage, and separately by exact amount; confirm each slice saves as its own transaction.
- Drag a split's slider while adjusting another split, and confirm the dragged slider's max doesn't clamp/jump mid-drag.
- Explicitly test the **first** split (index 0) as the calculator target — it's a falsy index and a regression here is easy to introduce ([GOTCHAS.md](./GOTCHAS.md#ui--animation)).
