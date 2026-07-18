import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { BottomSheetModal } from './BottomSheetModal';
import { useTheme } from '../../providers/ThemeProvider';
import { useSharedStyles } from '../../theme/styles';
import { transactionService } from '../../services/transactionService';
import { TransactionItem } from '../data/TransactionItem';
import { formatAmount } from '../../utils/formatting';

interface CategoryTransactionsModalProps {
  visible: boolean;
  onClose: () => void;
  categoryId: number;
  categoryName: string;
  emoji: string;
  periodStart: string;
  periodEnd: string;
  type?: 'expense' | 'income';
}

export const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  visible,
  onClose,
  categoryId,
  categoryName,
  emoji,
  periodStart,
  periodEnd,
  type = 'expense',
}) => {
  const { theme } = useTheme();
  const shared = useSharedStyles();

  // Load transactions whenever the modal opens
  const transactions = useMemo(
    () => (visible ? transactionService.getTransactionsForCategory(categoryId, periodStart, periodEnd) : []),
    [visible, categoryId, periodStart, periodEnd]
  );

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <BottomSheetModal visible={visible} onClose={onClose} sheetStyle={styles.sheet}>
      {/* Header */}
      <View style={styles.sheetHeader}>
        <View style={styles.headerLeft}>
          <Text style={[shared.modal.sheetTitle, styles.sheetTitle]}>
            {emoji ? `${emoji} ` : ''}{categoryName}
          </Text>
          <Text style={[styles.totalText, { color: theme.colors.onSurfaceVariant }]}>
            {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} · {formatAmount(totalAmount, type)}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose}>
          <FontAwesome name="times" size={18} color={theme.colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {transactions.length === 0 ? (
        <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
          No transactions in this period.
        </Text>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {transactions.map((t) => (
            <TransactionItem
              key={t.id}
              transaction={t}
              categoryEmoji={emoji}
              categoryName={categoryName}
              dateDisplayMode="relative"
            />
          ))}
        </ScrollView>
      )}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  sheet: {
    maxHeight: '80%',
    padding: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  sheetTitle: {
    marginBottom: 2,
  },
  totalText: {
    fontSize: 13,
  },
  listContent: {
    paddingBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
});
