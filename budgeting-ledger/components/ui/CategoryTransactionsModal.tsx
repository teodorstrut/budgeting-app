import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import { AnimatedBackdrop } from './AnimatedBackdrop';
import { useTheme } from '../../providers/ThemeProvider';
import { Transaction } from '../../database/repositories/transactionRepository';
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
}

export const CategoryTransactionsModal: React.FC<CategoryTransactionsModalProps> = ({
  visible,
  onClose,
  categoryId,
  categoryName,
  emoji,
  periodStart,
  periodEnd,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const heightRef = useRef(0);
  const hasLaidOut = useRef(false);

  // Load transactions whenever the modal opens
  useEffect(() => {
    if (visible) {
      setTransactions(transactionService.getTransactionsForCategory(categoryId, periodStart, periodEnd));
    }
  }, [visible, categoryId, periodStart, periodEnd]);

  useEffect(() => {
    if (!hasLaidOut.current) return;
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : heightRef.current,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: visible ? 1 : 0,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      <AnimatedBackdrop opacity={backdropOpacity} visible={visible} onPress={onClose} />

      <Animated.View
        pointerEvents={visible ? 'auto' : 'none'}
        style={[
          styles.sheet,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
            transform: [{ translateY }],
          },
        ]}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          heightRef.current = h;
          if (!hasLaidOut.current) {
            hasLaidOut.current = true;
            if (!visible) {
              translateY.setValue(h);
              backdropOpacity.setValue(0);
            }
          }
        }}
      >
        {/* Header */}
        <View style={styles.sheetHeader}>
          <View style={styles.headerLeft}>
            <Text style={[styles.sheetTitle, { color: onSurface }]}>
              {emoji ? `${emoji} ` : ''}{categoryName}
            </Text>
            <Text style={[styles.totalText, { color: theme.colors.onSurfaceVariant }]}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} · {formatAmount(totalAmount, 'expense')}
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
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 11,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    fontSize: 18,
    fontWeight: '700',
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
