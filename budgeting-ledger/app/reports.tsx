import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { MonthNavigator } from '../components/layout/MonthNavigator';
import { DonutChart, CHART_COLORS, type DonutSlice } from '../components/charts/DonutChart';
import { SpendingBarChart, type BarDataPoint } from '../components/charts/SpendingBarChart';
import { CategoryPickerModal } from '../components/ui/CategoryPickerModal';
import { ToggleButtonGroup } from '../components/ui/ToggleButtonGroup';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { ProgressBar } from '../components/ui/ProgressBar';
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

  // Donut chart type toggle
  const [donutType, setDonutType] = useState<'expense' | 'income'>('expense');

  // Incremented on every screen focus to trigger a data reload
  const [focusTick, setFocusTick] = useState(0);

  // Data state
  const [donutSlices, setDonutSlices] = useState<DonutSlice[]>([]);
  const [allCategoryData, setAllCategoryData] = useState<AllCategoryEntry[]>([]);
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
  useEffect(() => {
    const day = settingsService.getMonthStartDay();

    // 1. Donut chart — category spending (respects donutType: expense | income)
    const categorySpending = transactionService.getCategorySpendingForMonth(
      periodStart,
      periodEnd,
      donutType
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

    // 2. All Categories list (expense budget view — always loaded for quick switch)
    const allData = budgetService.getAllCategoryBudgetData(periodStart, periodEnd);
    setAllCategoryData(allData);

    // 3. Expense categories for the picker
    const cats = categoryRepository.getAll().filter((c) => c.type === 'expense');
    setExpenseCategories(cats);
  }, [periodStart, periodEnd, donutType, focusTick]);

  // ── spending evolution (sync SQLite → useMemo so data is ready on same render
  //    as the key change, preventing gifted-charts from mounting with stale data) ──
  const evolutionData = useMemo<BarDataPoint[]>(() => {
    const day = settingsService.getMonthStartDay();
    const windowPeriods: { start: string; end: string; calLabel: string }[] = [];
    let cur = new Date(anchorMonth.getFullYear(), anchorMonth.getMonth() - 3, 1);
    for (let i = 0; i < 7; i++) {
      const [s, e] = monthUtils.getMonthPeriodForDate(day, toDateInMonth(cur));
      // Use calendar month of the loop anchor for the label, NOT p.start.
      // When monthStartDay > 15, p.start falls in the previous calendar month
      // which would show the wrong month name.
      const calLabel = cur.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
      windowPeriods.push({ start: s, end: e, calLabel });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    const totals = transactionService.getSpendingEvolutionForPeriods(
      windowPeriods,
      selectedCategoryId
    );
    return totals.map((p, i) => ({
      label: windowPeriods[i].calLabel,
      value: p.total,
      isCurrent: i === 3,
    }));
  }, [anchorMonth, selectedCategoryId, focusTick]);

  useFocusEffect(
    useCallback(() => {
      setFocusTick((t) => t + 1);
    }, [])
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
        <MonthNavigator
          label={monthLabel}
          onPrevious={() => moveMonth(-1)}
          onNext={() => moveMonth(1)}
        />

        {/* ── Card 1: Monthly Spending ─────────────────────────────────────── */}
        <Card style={styles.cardGap}>
          <Text style={[styles.cardTitle, { color: theme.colors.onSurfaceVariant }]}>
            Monthly Spending
          </Text>
          <ToggleButtonGroup
            options={[
              { label: 'Expenses', value: 'expense' },
              { label: 'Income', value: 'income' },
            ]}
            selected={donutType}
            onSelect={setDonutType}
            activeColor={donutType === 'expense' ? theme.colors.secondary : theme.colors.primary}
            activeTextColor={theme.colors.surface}
            inactiveTextColor={theme.colors.onSurfaceVariant}
            borderColor={theme.colors.outlineVariant}
          />
          <DonutChart
            data={donutSlices}
            totalLabel={donutType === 'expense' ? 'Total Spent' : 'Total Income'}
            totalValue={formatCurrency(totalSpent)}
            size={200}
          />
        </Card>

        {/* ── Card 2: All Categories ───────────────────────────────────────── */}
        <Card style={styles.cardGap}>
          <Text style={[styles.cardTitle, { color: theme.colors.onSurfaceVariant }]}>
            All Categories
          </Text>

          {allCategoryData.length === 0 ? (
            <EmptyState
              title="No transactions"
              subtitle="No expense transactions recorded this month."
            />
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
                      <ProgressBar
                        progress={ratio}
                        height={10}
                        color={barColor}
                        trackColor={theme.colors.surfaceContainerHigh}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </Card>

        {/* ── Card 3: Spending Evolution ───────────────────────────────────── */}
        <Card style={styles.cardGap}>
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

          <SpendingBarChart
            key={`${anchorMonth.getFullYear()}-${anchorMonth.getMonth()}-${selectedCategoryId ?? 'all'}`}
            data={evolutionData}
          />
        </Card>
      </ScrollView>

      {/* ── Category Picker Modal ─────────────────────────────────────────── */}
      <CategoryPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        categories={expenseCategories}
        onSelectCategory={(cat) => {
          setSelectedCategoryId(cat.id ?? null);
          setPickerVisible(false);
        }}
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
  // Cards
  cardGap: {
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
});
