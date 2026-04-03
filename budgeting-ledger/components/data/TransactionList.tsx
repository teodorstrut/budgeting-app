import React from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../../database/repositories/transactionRepository';
import { TransactionItem } from './TransactionItem';
import { useTheme } from '../../app/ThemeProvider';

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, title }) => {
  const { theme } = useTheme();

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>No transactions yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>{title}</Text>}
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        renderItem={({ item }) => <TransactionItem transaction={item} />}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
  },
});