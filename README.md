# Budgeting Ledger

A simple, personal budget tracking app — free forever, open source, and built for anyone who wants to take control of their finances.

## About

Budgeting Ledger helps you track your income and expenses, set monthly budgets, and understand your spending habits — all from your phone. Your data stays on your device by default, with an optional sync to Google Sheets. There are no subscriptions, no ads, and no hidden costs. This app is free forever.

## Features

- **Dashboard** — See your monthly balance, total income, total expenses, and a budget health summary at a glance.
- **Transactions** — Add, edit, and delete income and expense transactions. Uses a calculator-style keypad for quick amount entry.
- **Categories** — Create custom categories with emoji icons for both income and expenses.
- **Budgets** — Set monthly spending limits per category and track how you're tracking against them with color-coded progress indicators.
- **Budget Health** — A dedicated view showing how much you've spent vs. your budget for every category.
- **History** — Browse past months, search transactions by note, amount, or category, with entries grouped by date.
- **Reports** — Visualize your spending with a category breakdown (donut chart) and a monthly trend chart (bar chart). Toggle budget overlays to compare actuals vs. limits.
- **Bill Splitter** — Split a single bill across multiple categories using percentage or amount sliders, then save each split as a separate transaction.
- **Google Sheets Sync** — Optionally connect your Google account and sync your transactions to a spreadsheet. Supports manual and automatic daily background sync.
- **Settings** — Switch between light and dark themes, configure a custom month-start day (e.g. if your pay cycle starts on the 15th), and manage categories.

## How It Works

Budgeting Ledger is built with React Native and Expo, using file-based routing via Expo Router. All data is stored locally in a SQLite database on your device — no account required, works fully offline. A service and repository layer keeps business logic separate from the UI. Optionally, you can connect Google Sheets via OAuth to back up and view your transactions in a spreadsheet.

## Contributing

This project is open source and open to change requests. If you have a feature idea, a bug to report, or an improvement to suggest, feel free to open an issue or submit a pull request — contributions of all kinds are welcome.

## License

MIT — see [LICENSE](../LICENSE).
