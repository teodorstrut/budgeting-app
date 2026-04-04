import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Transaction } from '../../database/repositories/transactionRepository';
import { useTheme } from '../../providers/ThemeProvider';
import { formatAmount } from '../../utils/formatting';

interface TransactionItemProps {
  transaction: Transaction;
  categoryEmoji?: string;
  categoryName?: string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  categoryEmoji,
  categoryName,
}) => {
  const { theme } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
      return 'just now';
    }

    const hourMs = 60 * 60 * 1000;
    const dayMs = 24 * hourMs;
    const weekMs = 7 * dayMs;
    const monthMs = 30 * dayMs;

    if (diffMs < hourMs) {
      const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }

    if (diffMs < dayMs) {
      const hours = Math.floor(diffMs / hourMs);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    }

    if (diffMs < weekMs) {
      const days = Math.floor(diffMs / dayMs);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }

    if (diffMs < monthMs) {
      const weeks = Math.floor(diffMs / weekMs);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    }

    const months = Math.floor(diffMs / monthMs);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceContainerLow }]}>
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
            <Text style={[styles.metaText, { color: theme.colors.outline }]}>{formatDate(transaction.date)}</Text>
          </View>
        </View>
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