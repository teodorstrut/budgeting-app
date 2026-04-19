import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { transactionService } from '../services/transactionService';
import { settingsService } from '../services/settingsService';
import { monthUtils } from '../utils/monthUtils';
import { SummaryTile } from '../components/ui/SummaryTile';
import { TransactionList } from '../components/data/TransactionList';
import { Transaction } from '../database/repositories/transactionRepository';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';
import { AddTransactionButton } from '../components/layout/AddTransactionButton';

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

  useFocusEffect(
    useCallback(() => {
      const day = settingsService.getMonthStartDay();
      
      const start = monthUtils.getCurrentMonthStart(day);
      const end = monthUtils.getCurrentMonthEnd(day);
      
      setSummary(transactionService.getSummaryForDateRange(start, end));
      setRecentTransactions(transactionService.getRecentTransactionsForDateRange(start, end, 5));
      setMonthLabel(getMonthLabel(start));
    }, [])
  );

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const navigateToEdit = (transaction: Transaction) => {
    if (transaction.id == null) {
      return;
    }

    router.push({ pathname: '/add', params: { editId: transaction.id.toString() } });
  };

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

        <TransactionList
          transactions={recentTransactions}
          title="Recent Transactions This Month"
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
});
