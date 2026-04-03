import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from './ThemeProvider';
import { useRouter } from 'expo-router';
import { transactionService } from '../services/transactionService';
import { SummaryTile } from '../components/ui/SummaryTile';
import { TransactionList } from '../components/data/TransactionList';
import { Transaction } from '../database/repositories/transactionRepository';
import { Header } from './Header';
import { NavBar } from './NavBar';
import { AddTransactionButton } from './AddTransactionButton';

export default function Index() {
  const { theme } = useTheme();
  const router = useRouter();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const loadData = () => {
      const sum = transactionService.getSummary();
      setSummary(sum);
      const recent = transactionService.getRecentTransactions(5);
      setRecentTransactions(recent);
    };
    loadData();
  }, []);

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="Ledger" rightIconName="cog" onRightPress={() => router.push('/settings')} />

        <Text style={[styles.currentBalanceLabel, { color: theme.colors.outline }]}>Current Balance</Text>

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
            title="Total Income"
            value={formatCurrency(summary.totalIncome)}
            color={theme.colors.primary}
          />
          <SummaryTile
            title="Total Expenses"
            value={formatCurrency(summary.totalExpenses)}
            color={theme.colors.secondary}
          />
        </View>

        <TransactionList transactions={recentTransactions} title="Recent Transactions" />
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
