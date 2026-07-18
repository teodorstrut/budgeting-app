import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { transactionService } from '../services/transactionService';
import { SummaryTile } from '../components/ui/SummaryTile';
import { BudgetHealthWidget } from '../components/ui/BudgetHealthWidget';
import { TransactionList } from '../components/data/TransactionList';
import { Transaction } from '../database/repositories/transactionRepository';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';
import { AddTransactionButton } from '../components/layout/AddTransactionButton';
import { budgetService } from '../services/budgetService';
import { OwnershipToggle } from '../components/ui/OwnershipToggle';
import { useCurrentMonthPeriod } from '../hooks/useCurrentMonthPeriod';
import { formatCurrency, formatMonthLabel } from '../utils/formatting';

export default function Index() {
  const { theme } = useTheme();
  const router = useRouter();
  const [ownershipFilter, setOwnershipFilter] = useState<'mine' | 'all'>('mine');
  const { periodStart, periodEnd, focusTick } = useCurrentMonthPeriod();

  const summary = useMemo(
    () => transactionService.getSummaryForDateRange(periodStart, periodEnd),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodStart, periodEnd, focusTick]
  );
  const recentTransactions = useMemo(
    () => transactionService.getRecentTransactionsForDateRange(periodStart, periodEnd, 5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [periodStart, periodEnd, focusTick]
  );
  const hasBudgets = useMemo(
    () => budgetService.hasBudgets(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [focusTick]
  );
  const budgetHealthData = useMemo(
    () => (hasBudgets ? budgetService.getBudgetHealthData(periodStart, periodEnd) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [hasBudgets, periodStart, periodEnd, focusTick]
  );

  const monthLabel = formatMonthLabel(periodStart);
  const navigateToEdit = (transaction: Transaction) => {
    if (transaction.id == null) {
      return;
    }

    router.push({ pathname: '/add', params: { editId: transaction.id.toString() } });
  };

  const displayedTransactions = ownershipFilter === 'mine'
    ? recentTransactions.filter((t) => t.isReadOnly !== 1)
    : recentTransactions;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="Ledger" rightIconName="cog" onRightPress={() => router.push('/settings')} />

        <Text style={[styles.currentBalanceLabel, { color: theme.colors.outline }]}>{monthLabel} Balance</Text>

        <View style={[styles.balanceBubble, { backgroundColor: theme.colors.primaryContainer }]}> 
          <Text
            style={[
              styles.balanceValue,
              { color: summary.balance >= 0 ? theme.colors.onPrimary : theme.colors.secondary },
            ]}
          >
            {formatCurrency(summary.totalIncome - summary.totalExpenses)}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <SummaryTile
            title="Month Income"
            value={formatCurrency(summary.totalIncome)}
            color={theme.colors.primary}
          />
          <SummaryTile
            title="Month Expenses"
            value={formatCurrency(summary.totalExpenses)}
            color={theme.colors.secondary}
          />
        </View>

        {hasBudgets && <BudgetHealthWidget entries={budgetHealthData} />}

        <View style={styles.recentHeader}>
          <Text style={[styles.recentTitle, { color: theme.colors.onSurfaceVariant }]}>Recent Transactions</Text>
          <OwnershipToggle value={ownershipFilter} onChange={setOwnershipFilter} />
        </View>

        <TransactionList
          transactions={displayedTransactions}
          onTransactionPress={navigateToEdit}
        />
      </ScrollView>

      <AddTransactionButton />
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 200,
  },
  currentBalanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    textAlign: 'left',
  },
  balanceBubble: {
    borderRadius: 24,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
});
