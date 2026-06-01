import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router/react-navigation';
import { transactionService } from '../services/transactionService';
import { settingsService } from '../services/settingsService';
import { monthUtils } from '../utils/monthUtils';
import { SummaryTile } from '../components/ui/SummaryTile';
import { BudgetHealthWidget } from '../components/ui/BudgetHealthWidget';
import { TransactionList } from '../components/data/TransactionList';
import { Transaction } from '../database/repositories/transactionRepository';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';
import { AddTransactionButton } from '../components/layout/AddTransactionButton';
import { budgetService, BudgetHealthEntry } from '../services/budgetService';
import { OwnershipToggle } from '../components/ui/OwnershipToggle';

const getMonthLabel = (startDate: string): string => {
  const [y, m] = startDate.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

export default function Index() {
  const { theme } = useTheme();
  const router = useRouter();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthLabel, setMonthLabel] = useState('');
  const [budgetHealthData, setBudgetHealthData] = useState<BudgetHealthEntry[]>([]);
  const [hasBudgets, setHasBudgets] = useState(false);
  const [ownershipFilter, setOwnershipFilter] = useState<'mine' | 'all'>('mine');

  useFocusEffect(
    useCallback(() => {
      const day = settingsService.getMonthStartDay();
      
      const start = monthUtils.getCurrentMonthStart(day);
      const end = monthUtils.getCurrentMonthEnd(day);
      
      setSummary(transactionService.getSummaryForDateRange(start, end));
      const allRecent = transactionService.getRecentTransactionsForDateRange(start, end, 5);
      setRecentTransactions(allRecent);
      setMonthLabel(getMonthLabel(start));
      const budgetsExist = budgetService.hasBudgets();
      setHasBudgets(budgetsExist);
      if (budgetsExist) {
        setBudgetHealthData(budgetService.getBudgetHealthData(start, end));
      }
    }, [])
  );

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
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
