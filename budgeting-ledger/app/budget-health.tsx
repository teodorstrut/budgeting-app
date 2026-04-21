import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../providers/ThemeProvider';
import { budgetService, BudgetHealthEntry } from '../services/budgetService';
import { settingsService } from '../services/settingsService';
import { monthUtils } from '../utils/monthUtils';
import { Header } from '../components/layout/Header';
import { NavBar } from '../components/layout/NavBar';

export default function BudgetHealth() {
  const { theme } = useTheme();
  const router = useRouter();
  const [entries, setEntries] = useState<BudgetHealthEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      const day = settingsService.getMonthStartDay();
      const start = monthUtils.getCurrentMonthStart(day);
      const end = monthUtils.getCurrentMonthEnd(day);
      setEntries(budgetService.getBudgetHealthData(start, end));
    }, [])
  );

  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;

  const barColorForRatio = (ratio: number): string => {
    if (ratio >= 1) return '#ef4444';
    if (ratio >= 0.8) return theme.colors.secondary;
    return theme.colors.primary;
  };

  const deltaLabel = (entry: BudgetHealthEntry): { text: string; color: string } => {
    const abs = Math.abs(entry.delta);
    if (entry.delta > 0) {
      return { text: `+$${abs.toFixed(2)} over`, color: '#ef4444' };
    }
    if (entry.delta === 0) {
      return { text: 'At limit', color: theme.colors.secondary };
    }
    return { text: `-$${abs.toFixed(2)} left`, color: theme.colors.primary };
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Header
          title="Budget Health"
          showBackButton
          onBackPress={() => router.back()}
          titleColor={theme.colors.primary}
        />

        {entries.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surfaceContainerLow, borderColor: theme.colors.outlineVariant }]}>
            <Text style={[styles.emptyTitle, { color: onSurface }]}>No data to display</Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
              Set up budgets and record transactions to see your budget health here.
            </Text>
          </View>
        ) : (
          entries.map((entry) => {
            const ratio = entry.amount > 0 ? entry.spent / entry.amount : 0;
            const barColor = barColorForRatio(Math.min(ratio, 1));
            const pct = Math.min(ratio * 100, 100);
            const { text: deltaText, color: deltaColor } = deltaLabel(entry);

            return (
              <View
                key={entry.categoryId}
                style={[
                  styles.entryCard,
                  {
                    backgroundColor: theme.colors.surfaceContainerLow,
                    borderColor: theme.colors.outlineVariant,
                  },
                ]}
              >
                {/* Row 1: emoji + name + delta pill */}
                <View style={styles.entryTopRow}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                    <Text style={[styles.entryName, { color: onSurface }]}>{entry.categoryName}</Text>
                  </View>
                  <View style={[styles.deltaPill, { backgroundColor: deltaColor + '22' }]}>
                    <Text style={[styles.deltaText, { color: deltaColor }]}>{deltaText}</Text>
                  </View>
                </View>

                {/* Row 2: spent / budget amounts */}
                <View style={styles.amountRow}>
                  <Text style={[styles.spentAmount, { color: barColor }]}>
                    ${entry.spent.toFixed(2)}
                  </Text>
                  <Text style={[styles.budgetAmount, { color: theme.colors.onSurfaceVariant }]}>
                    {' '}/ ${entry.amount.toFixed(2)} budget
                  </Text>
                </View>

                {/* Progress bar */}
                <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
                  <View
                    style={[
                      styles.progressFill,
                      { backgroundColor: barColor, width: `${pct}%` },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
      <NavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  emptyCard: {
    marginTop: 24,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  emptySubtext: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  entryCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  entryEmoji: { fontSize: 22 },
  entryName: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  deltaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    marginLeft: 8,
  },
  deltaText: { fontSize: 12, fontWeight: '700' },
  amountRow: { flexDirection: 'row', alignItems: 'baseline' },
  spentAmount: { fontSize: 20, fontWeight: '800' },
  budgetAmount: { fontSize: 14, fontWeight: '500' },
  progressTrack: { height: 8, borderRadius: 9999, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 9999 },
});
