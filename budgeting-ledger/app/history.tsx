import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../providers/ThemeProvider';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';
import { AddTransactionButton } from '../components/layout/AddTransactionButton';
import { transactionService } from '../services/transactionService';
import { categoryRepository } from '../database/repositories/categoryRepository';
import { Transaction } from '../database/repositories/transactionRepository';
import db from '../database/connection';
import { parseMaybeDate, formatAmount, formatTime } from '../utils/formatting';

interface GroupedTransactions {
  key: string;
  heading: string;
  items: Transaction[];
}

const getMonthStartDay = () => {
  try {
    const row = db.getFirstSync('SELECT value FROM settings WHERE key = ?', ['monthStartDay']);
    const parsed = Number.parseInt(String(row?.value ?? '1'), 10);
    if (Number.isNaN(parsed)) {
      return 1;
    }
    return Math.max(1, Math.min(31, parsed));
  } catch {
    return 1;
  }
};

const getDaysInMonth = (year: number, monthIndex: number) => new Date(year, monthIndex + 1, 0).getDate();

const formatMonthWindowLabel = (start: Date, end: Date) => {
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  return `${start.toLocaleDateString(undefined, { month: 'short' })} ${start.getDate()} - ${end.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;
};

const formatSectionHeading = (date: Date) => {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const oneDay = 24 * 60 * 60 * 1000;

  if (dateStart === todayStart) {
    return `Today, ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  if (dateStart === todayStart - oneDay) {
    return `Yesterday, ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export default function History() {
  const { theme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [anchorMonth, setAnchorMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useFocusEffect(
    React.useCallback(() => {
      setRefreshTick((current) => current + 1);
    }, [])
  );

  const monthStartDay = getMonthStartDay();
  const categoriesById = useMemo(
    () => new Map(categoryRepository.getAll().map((category) => [category.id, category])),
    []
  );

  const monthWindow = useMemo(() => {
    const year = anchorMonth.getFullYear();
    const month = anchorMonth.getMonth();
    const currentStartDay = Math.min(monthStartDay, getDaysInMonth(year, month));
    const start = new Date(year, month, currentStartDay, 0, 0, 0, 0);

    const nextMonthDate = new Date(year, month + 1, 1, 0, 0, 0, 0);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = nextMonthDate.getMonth();
    const nextStartDay = Math.min(monthStartDay, getDaysInMonth(nextYear, nextMonth));
    const nextStart = new Date(nextYear, nextMonth, nextStartDay, 0, 0, 0, 0);
    const end = new Date(nextStart.getTime() - 1);

    return { start, end };
  }, [anchorMonth, monthStartDay]);

  const groupedTransactions = useMemo<GroupedTransactions[]>(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const transactions = transactionService.getTransactions().filter((item) => {
      const txDate = parseMaybeDate(item.date);
      if (!txDate) {
        return false;
      }

      if (txDate < monthWindow.start || txDate > monthWindow.end) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const categoryName = item.categoryId != null ? categoriesById.get(item.categoryId)?.name ?? '' : '';
      const note = item.note ?? '';
      const amount = item.amount.toString();

      return (
        note.toLowerCase().includes(normalizedQuery) ||
        categoryName.toLowerCase().includes(normalizedQuery) ||
        amount.includes(normalizedQuery)
      );
    });

    // Always display entries in reverse chronological order.
    transactions.sort((a, b) => {
      const dateA = parseMaybeDate(a.date)?.getTime() ?? 0;
      const dateB = parseMaybeDate(b.date)?.getTime() ?? 0;
      return dateB - dateA;
    });

    const grouped = new Map<string, { date: Date; items: Transaction[] }>();

    transactions.forEach((item) => {
      const date = parseMaybeDate(item.date);
      if (!date) {
        return;
      }

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
        date.getDate()
      ).padStart(2, '0')}`;

      const existing = grouped.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        grouped.set(key, { date, items: [item] });
      }
    });

    return [...grouped.entries()]
      .sort((a, b) => b[1].date.getTime() - a[1].date.getTime())
      .map(([key, value]) => ({
        key,
        heading: formatSectionHeading(value.date),
        items: value.items,
      }));
  }, [categoriesById, monthWindow.end, monthWindow.start, query, refreshTick]);

  const navigateToEdit = (transaction: Transaction) => {
    if (transaction.id == null) {
      return;
    }
    router.push({ pathname: '/add', params: { editId: transaction.id.toString() } });
  };

  const moveMonth = (direction: -1 | 1) => {
    setAnchorMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header title="Ledger" rightIconName="cog" onRightPress={() => router.push('/settings')} />

        <View style={styles.monthControlsRow}>
          <TouchableOpacity
            style={[styles.monthArrowButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
            onPress={() => moveMonth(-1)}
          >
            <FontAwesome name="angle-left" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: theme.colors.onSurface }]}>
            {formatMonthWindowLabel(monthWindow.start, monthWindow.end)}
          </Text>
          <TouchableOpacity
            style={[styles.monthArrowButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
            onPress={() => moveMonth(1)}
          >
            <FontAwesome name="angle-right" size={20} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.periodHint, { color: theme.colors.outline }]}>Month starts on day {monthStartDay}</Text>

        <View style={[styles.searchBox, { backgroundColor: theme.colors.surfaceContainerLow }]}>
          <FontAwesome name="search" size={14} color={theme.colors.outline} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.onSurface }]}
            value={query}
            onChangeText={setQuery}
            placeholder="Search note, category, or amount"
            placeholderTextColor={theme.colors.outline}
          />
        </View>

        <View style={styles.sectionsWrap}>
          {groupedTransactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceContainerLow }]}>
              <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>No transactions in this period</Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.onSurfaceVariant }]}>Adjust month or search to see entries.</Text>
            </View>
          ) : (
            groupedTransactions.map((group) => (
              <View key={group.key} style={styles.daySection}>
                <Text style={[styles.dayHeading, { color: theme.colors.onSurfaceVariant }]}>{group.heading}</Text>

                <View style={styles.dayItemsWrap}>
                  {group.items.map((transaction) => {
                    const category = transaction.categoryId != null ? categoriesById.get(transaction.categoryId) : undefined;
                    const transactionName = transaction.note || 'Untitled transaction';

                    return (
                      <TouchableOpacity
                        key={transaction.id?.toString() || `${transaction.amount}-${transaction.date}`}
                        style={[styles.transactionRow, { backgroundColor: theme.colors.surfaceContainerLow }]}
                        onPress={() => navigateToEdit(transaction)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.transactionLeftWrap}>
                          <View style={[styles.categoryBadge, { backgroundColor: theme.colors.surfaceContainerHighest, borderColor: transaction.type === 'income' ? theme.colors.primary : theme.colors.secondary }]}>
                            <Text style={styles.categoryEmoji}>{category?.emoji || '•'}</Text>
                          </View>

                          <View style={styles.transactionTextWrap}>
                            <Text numberOfLines={1} style={[styles.transactionTitle, { color: theme.colors.onSurface }]}>
                              {transactionName}
                            </Text>
                            <Text style={[styles.transactionMeta, { color: theme.colors.onSurfaceVariant }]}>
                              {category?.name || 'Uncategorized'} • {formatTime(transaction.date)}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.amountAndMenuWrap}>
                          <Text
                            style={[
                              styles.amount,
                              {
                                color:
                                  transaction.type === 'income' ? theme.colors.primary : theme.colors.onSurface,
                              },
                            ]}
                          >
                            {formatAmount(transaction.amount, transaction.type)}
                          </Text>
                            <FontAwesome name="angle-right" size={14} color={theme.colors.outline} style={styles.chevron} />
                        </View>
                        </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
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
    paddingBottom: 220,
  },
  monthControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  monthArrowButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  periodHint: {
    fontSize: 12,
    marginBottom: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  sectionsWrap: {
    marginTop: 14,
    gap: 16,
  },
  daySection: {
    gap: 10,
  },
  dayHeading: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginLeft: 2,
  },
  dayItemsWrap: {
    gap: 8,
  },
  transactionRow: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 10,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderStyle: 'dotted',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 20,
  },
  transactionTextWrap: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  transactionMeta: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '500',
  },
  amountAndMenuWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
  },
  chevron: {
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginTop: 18,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    textAlign: 'center',
  },
});