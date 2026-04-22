import React, { useCallback, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../providers/ThemeProvider';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';
import { DonutChart, CHART_COLORS, type DonutSlice } from '../components/charts/DonutChart';
import { SpendingBarChart, type BarDataPoint } from '../components/charts/SpendingBarChart';
import { CategoryPickerModal } from '../components/ui/CategoryPickerModal';
import { transactionService } from '../services/transactionService';
import { budgetService } from '../services/budgetService';
import { categoryRepository, type Category } from '../database/repositories/categoryRepository';
import { settingsService } from '../services/settingsService';
import { monthUtils } from '../utils/monthUtils';

// ─── helpers ──────────────────────────────────────────────────────────────────

const toDateInMonth = (anchorMonth: Date): string => {
  const y = anchorMonth.getFullYear();
  const m = String(anchorMonth.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-15`;
};

const formatMonthLabel = (start: string): string => {
  const [y, mo] = start.split('-').map(Number);
  const d = new Date(y, mo - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const shortMonthLabel = (start: string): string => {
  const [y, mo] = start.split('-').map(Number);
  return new Date(y, mo - 1, 1)
    .toLocaleDateString(undefined, { month: 'short' })
    .toUpperCase();
};

const formatCurrency = (value: number): string => `$${value.toFixed(2)}`;

const barColorForRatio = (ratio: number, primary: string, secondary: string): string => {
  if (ratio >= 1) return '#ef4444';
  if (ratio >= 0.8) return secondary;
  return primary;
};

// ─── types ────────────────────────────────────────────────────────────────────

interface AllCategoryEntry {
  categoryId: number;
  categoryName: string;
  emoji: string;
  spent: number;
  budget: number | null;
}

// ─── component ────────────────────────────────────────────────────────────────

export default function Reports() {
  const { theme } = useTheme();
  const router = useRouter();

  // Month navigation
  const [anchorMonth, setAnchorMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Category filter for bar chart
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);

  // Data state
  const [donutSlices, setDonutSlices] = useState<DonutSlice[]>([]);
  const [allCategoryData, setAllCategoryData] = useState<AllCategoryEntry[]>([]);
  const [evolutionData, setEvolutionData] = useState<BarDataPoint[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [totalSpent, setTotalSpent] = useState(0);

  // ── month period ─────────────────────────────────────────────────────────
  const { periodStart, periodEnd, monthLabel } = useMemo(() => {
    const day = settingsService.getMonthStartDay();
    const [start, end] = monthUtils.getMonthPeriodForDate(day, toDateInMonth(anchorMonth));
    return {
      periodStart: start,
      periodEnd: end,
      monthLabel: formatMonthLabel(start),
    };
  }, [anchorMonth]);

  const moveMonth = (dir: -1 | 1) => {
    setAnchorMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1));
  };

  // ── load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(() => {
    const day = settingsService.getMonthStartDay();

    // 1. Donut chart — category spending
    const categorySpending = transactionService.getCategorySpendingForMonth(
      periodStart,
      periodEnd
    );
    const spent = categorySpending.reduce((acc, s) => acc + s.totalSpent, 0);
    setTotalSpent(spent);
    setDonutSlices(
      categorySpending.map((s, i) => ({
        label: `${s.emoji} ${s.categoryName}`,
        value: s.totalSpent,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }))
    );

    // 2. All Categories list
    const allData = budgetService.getAllCategoryBudgetData(periodStart, periodEnd);
    setAllCategoryData(allData);

    // 3. Expense categories for the picker
    const cats = categoryRepository.getAll().filter((c) => c.type === 'expense');
    setExpenseCategories(cats);

    // 4. Spending evolution — selected month is always the centre bar (index 2).
    // 2 months before and 2 months after are shown regardless of whether they
    // have data (they'll just render as 0-height bars).
    const periods: { start: string; end: string }[] = [];
    let curAnchor = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() - 2, 1);
    for (let i = 0; i < 5; i++) {
      const [s, e] = monthUtils.getMonthPeriodForDate(day, toDateInMonth(curAnchor));
      periods.push({ start: s, end: e });
      curAnchor = new Date(curAnchor.getFullYear(), curAnchor.getMonth() + 1, 1);
    }

    const evolutionTotals = transactionService.getSpendingEvolutionForPeriods(
      periods,
      selectedCategoryId
    );

    setEvolutionData(
      evolutionTotals.map((p, i) => ({
        label: shortMonthLabel(p.start),
        value: p.total,
        isCurrent: i === 2,
      }))
    );
  }, [periodStart, periodEnd, anchorMonth, selectedCategoryId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ── category picker label ─────────────────────────────────────────────────
  const selectedCategoryName = useMemo(() => {
    if (selectedCategoryId === null) return 'All Categories';
    const cat = expenseCategories.find((c) => c.id === selectedCategoryId);
    return cat ? `${cat.emoji ?? ''} ${cat.name}`.trim() : 'All Categories';
  }, [selectedCategoryId, expenseCategories]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Header title="Reports" rightIconName="cog" onRightPress={() => router.push('/settings')} />

        {/* Month Navigator */}
        <View
          style={[
            styles.monthPill,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => moveMonth(-1)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="chevron-left" size={14} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: theme.colors.primary }]}>{monthLabel}</Text>
          <TouchableOpacity
            style={styles.monthArrow}
            onPress={() => moveMonth(1)}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="chevron-right" size={14} color={theme.colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>

        {/* ── Card 1: Monthly Spending ─────────────────────────────────────── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.onSurfaceVariant }]}>
            Monthly Spending
          </Text>
          <DonutChart
            data={donutSlices}
            totalLabel="Total Spent"
            totalValue={formatCurrency(totalSpent)}
            size={200}
          />
        </View>

        {/* ── Card 2: All Categories ───────────────────────────────────────── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.colors.onSurfaceVariant }]}>
            All Categories
          </Text>

          {allCategoryData.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateTitle, { color: theme.colors.onSurface }]}>
                No transactions
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: theme.colors.onSurfaceVariant }]}>
                No expense transactions recorded this month.
              </Text>
            </View>
          ) : (
            <View style={styles.categoriesList}>
              {allCategoryData.map((entry) => {
                const ratio =
                  entry.budget != null && entry.budget > 0
                    ? Math.min(entry.spent / entry.budget, 1)
                    : 0;
                const barColor = barColorForRatio(
                  ratio,
                  theme.colors.primary,
                  theme.colors.secondary
                );
                const hasBudget = entry.budget !== null;

                return (
                  <View key={entry.categoryId} style={styles.categoryRow}>
                    <View style={styles.categoryRowHeader}>
                      <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                        {entry.emoji} {entry.categoryName}
                      </Text>
                      <Text
                        style={[styles.categoryAmount, { color: theme.colors.onSurfaceVariant }]}
                      >
                        {hasBudget
                          ? `${formatCurrency(entry.spent)} / ${formatCurrency(entry.budget!)}`
                          : formatCurrency(entry.spent)}
                      </Text>
                    </View>
                    {hasBudget && (
                      <View
                        style={[
                          styles.progressTrack,
                          { backgroundColor: theme.colors.surfaceContainerHigh },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${ratio * 100}%`, backgroundColor: barColor },
                          ]}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* ── Card 3: Spending Evolution ───────────────────────────────────── */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surfaceContainerLow,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <View style={styles.evolutionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.colors.onSurfaceVariant }]}>
                Spending Evolution
              </Text>
              <Text style={[styles.evolutionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Track your spending trends over time
              </Text>
            </View>

            {/* Category picker pill */}
            <TouchableOpacity
              style={[
                styles.pickerPill,
                {
                  backgroundColor: theme.colors.surfaceContainerHigh,
                  borderColor: theme.colors.outlineVariant,
                },
              ]}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.pickerPillText, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {selectedCategoryName}
              </Text>
              <FontAwesome
                name="chevron-down"
                size={11}
                color={theme.colors.onSurfaceVariant}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          </View>

          <SpendingBarChart data={evolutionData} />
        </View>
      </ScrollView>

      {/* ── Category Picker Modal ─────────────────────────────────────────── */}
      <CategoryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        categories={expenseCategories}
        onSelectCategory={(cat) => setSelectedCategoryId(cat.id ?? null)}
        selectedCategoryId={selectedCategoryId}
        title="Filter by Category"
        showAllOption
        onSelectAll={() => setSelectedCategoryId(null)}
      />

      <NavBar />
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 16,
  },
  // Month navigator
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 8,
  },
  monthArrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  // Cards
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  // Categories
  categoriesList: {
    gap: 14,
  },
  categoryRow: {
    gap: 6,
  },
  categoryRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
  // Evolution
  evolutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  evolutionSubtitle: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.75,
  },
  pickerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 160,
    flexShrink: 0,
  },
  pickerPillText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
