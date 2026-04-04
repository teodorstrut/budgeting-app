import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../providers/ThemeProvider';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { transactionService } from '../services/transactionService';
import { SummaryTile } from '../components/ui/SummaryTile';
import { TransactionList } from '../components/data/TransactionList';
import { Transaction } from '../database/repositories/transactionRepository';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';
import { AddTransactionButton } from '../components/layout/AddTransactionButton';
import db from '../database/connection';

const getMonthStartDay = (): number => {
  try {
    const row = db.getFirstSync('SELECT value FROM settings WHERE key = ?', ['monthStartDay']);
    const parsed = Number.parseInt(String(row?.value ?? '1'), 10);
    return Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(31, parsed));
  } catch {
    return 1;
  }
};

const getDaysInMonth = (year: number, monthIndex: number) =>
  new Date(year, monthIndex + 1, 0).getDate();

const getCurrentMonthWindow = (): { start: string; end: string; label: string } => {
  const monthStartDay = getMonthStartDay();
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startDay = Math.min(monthStartDay, getDaysInMonth(year, month));
  const start = new Date(year, month, startDay, 0, 0, 0, 0);

  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = (month + 1) % 12;
  const nextStartDay = Math.min(monthStartDay, getDaysInMonth(nextYear, nextMonth));
  const end = new Date(nextYear, nextMonth, nextStartDay, 0, 0, 0, 0);
  end.setMilliseconds(-1);

  const label = start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    label,
  };
};

export default function Index() {
  const { theme } = useTheme();
  const router = useRouter();
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0 });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [monthLabel, setMonthLabel] = useState('');

  useFocusEffect(
    useCallback(() => {
      const { start, end, label } = getCurrentMonthWindow();
      setSummary(transactionService.getSummaryForDateRange(start, end));
      setRecentTransactions(transactionService.getRecentTransactionsForDateRange(start, end, 5));
      setMonthLabel(label);
    }, [])
  );

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

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

        <TransactionList transactions={recentTransactions} title="Recent Transactions This Month" />
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
