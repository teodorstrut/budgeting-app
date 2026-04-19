import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Transaction } from '../../database/repositories/transactionRepository';
import { useTheme } from '../../providers/ThemeProvider';
import { formatAmount, formatRelativeDate, formatTime } from '../../utils/formatting';

type DateDisplayMode = 'relative' | 'time';

interface TransactionItemProps {
  transaction: Transaction;
  categoryEmoji?: string;
  categoryName?: string;
  onPress?: (transaction: Transaction) => void;
  dateDisplayMode?: DateDisplayMode;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  categoryEmoji,
  categoryName,
  onPress,
  dateDisplayMode = 'relative',
}) => {
  const { theme } = useTheme();

  const dateLabel = dateDisplayMode === 'time' ? formatTime(transaction.date) : formatRelativeDate(transaction.date);

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: theme.colors.surfaceContainerLow }]}
      onPress={onPress ? () => onPress(transaction) : undefined}
      activeOpacity={onPress ? 0.75 : 1}
      disabled={!onPress}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.emojiBadge,
            { borderColor: transaction.type === 'income' ? theme.colors.primary : theme.colors.secondary },
          ]}
        >
          <Text style={styles.emojiText}>{categoryEmoji || '•'}</Text>
        </View>

        <View style={styles.left}>
          <Text style={[styles.name, { color: theme.colors.onSurfaceVariant }]}>{transaction.note || 'Unnamed'}</Text>
          <View style={styles.metaRow}>
            {categoryName ? (
              <Text style={[styles.metaText, { color: theme.colors.outline }]}>{categoryName}</Text>
            ) : null}
            {categoryName ? <Text style={[styles.metaDivider, { color: theme.colors.outline }]}>•</Text> : null}
            <Text style={[styles.metaText, { color: theme.colors.outline }]}>{dateLabel}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.amount, { color: transaction.type === 'income' ? theme.colors.primary : theme.colors.secondary }]}>
        {formatAmount(transaction.amount, transaction.type)}
      </Text>
    </TouchableOpacity>
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
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emojiBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderStyle: 'dotted',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 18,
  },
  left: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    fontSize: 12,
  },
  metaDivider: {
    fontSize: 12,
    marginHorizontal: 6,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});