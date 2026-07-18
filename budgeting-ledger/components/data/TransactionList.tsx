import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../../database/repositories/transactionRepository';
import { TransactionItem } from './TransactionItem';
import { useTheme } from '../../providers/ThemeProvider';
import { categoryRepository } from '../../database/repositories/categoryRepository';
import { EmptyState } from '../ui/EmptyState';

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  onTransactionPress?: (transaction: Transaction) => void;
  dateDisplayMode?: 'relative' | 'time';
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  title,
  onTransactionPress,
  dateDisplayMode = 'relative',
}) => {
  const { theme } = useTheme();
  const categoriesById = useMemo(
    () => new Map(categoryRepository.getAll().map((category) => [category.id, category])),
    []
  );

  if (transactions.length === 0) {
    return <EmptyState title="No transactions yet" />;
  }

  return (
    <View style={styles.container}>
      {title && <Text style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>{title}</Text>}
      {transactions.map((item) => (
        <TransactionItem
          key={item.id?.toString() || `${item.amount}-${item.date}`}
          transaction={item}
          categoryEmoji={item.categoryId != null ? categoriesById.get(item.categoryId)?.emoji : undefined}
          categoryName={item.categoryId != null ? categoriesById.get(item.categoryId)?.name : undefined}
          onPress={onTransactionPress}
          dateDisplayMode={dateDisplayMode}
          isForeign={item.isReadOnly === 1}
        />
      ))}
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
});