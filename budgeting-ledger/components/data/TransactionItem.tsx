import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../../database/repositories/transactionRepository';
import { useTheme } from '../../app/ThemeProvider';

interface TransactionItemProps {
  transaction: Transaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'income' ? '+' : '-';
    return `${sign}$${amount.toFixed(2)}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceContainerLow }]}>
      <View style={styles.left}>
        <Text style={[styles.name, { color: theme.colors.onSurfaceVariant }]}>{transaction.name || 'Unnamed'}</Text>
        <Text style={[styles.date, { color: theme.colors.outline }]}>{formatDate(transaction.date)}</Text>
      </View>
      <Text style={[styles.amount, { color: transaction.type === 'income' ? theme.colors.primary : theme.colors.secondary }]}>
        {formatAmount(transaction.amount, transaction.type)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  left: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});