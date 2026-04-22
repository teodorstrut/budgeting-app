import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import { useSharedStyles } from '../../theme/styles';
import type { BudgetHealthEntry } from '../../services/budgetService';
import { Card } from './Card';
import { EmptyState } from './EmptyState';
import { ProgressBar } from './ProgressBar';

interface BudgetHealthWidgetProps {
  entries: BudgetHealthEntry[];
}

export const BudgetHealthWidget: React.FC<BudgetHealthWidgetProps> = ({ entries }) => {
  const { theme } = useTheme();
  const shared = useSharedStyles();
  const router = useRouter();

  const onSurface = theme.colors.onSurface ?? theme.colors.onSurfaceVariant;

  const barColorForRatio = (ratio: number): string => {
    if (ratio >= 1) return '#ef4444'; // over-budget: red
    if (ratio >= 0.8) return theme.colors.secondary; // warning: secondary (amber)
    return theme.colors.primary; // healthy: primary (mint)
  };

  const top5 = entries.slice(0, 5);
  const isEmpty = top5.length === 0;

  return (
    <Card style={[styles.cardExtra, { marginTop: 16, marginBottom: 4 }]}>
      {/* Widget Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: onSurface }]}>Budget Health</Text>
        <TouchableOpacity
          style={[shared.buttons.pill, { backgroundColor: theme.colors.primaryContainer + '22' }]}
          onPress={() => router.push('/budget-health')}
          activeOpacity={0.8}
        >
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {isEmpty ? (
        <EmptyState
          title="No transactions present"
          subtitle="Start recording transactions in order to see a comparison with the configured budget"
        />
      ) : (
        <View style={styles.entriesList}>
          {top5.map((entry, index) => {
            const ratio = entry.amount > 0 ? Math.min(entry.spent / entry.amount, 1) : 0;
            const barColor = barColorForRatio(ratio);
            const isLast = index === top5.length - 1;

            return (
              <View key={entry.categoryId} style={[styles.entryRow, !isLast && styles.entryRowBorder, { borderColor: theme.colors.outlineVariant }]}>
                {/* Top row: emoji + name | spent/budget */}
                <View style={styles.entryTopRow}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryEmoji}>{entry.emoji}</Text>
                    <Text style={[styles.entryName, { color: onSurface }]} numberOfLines={1}>
                      {entry.categoryName}
                    </Text>
                  </View>
                  <Text style={[styles.entryAmounts, { color: barColor }]}>
                    ${entry.spent.toFixed(0)}{' '}
                    <Text style={[styles.entryBudget, { color: theme.colors.onSurfaceVariant }]}>
                      / ${entry.amount.toFixed(0)}
                    </Text>
                  </Text>
                </View>

                {/* Progress bar */}
                <ProgressBar
                  progress={ratio}
                  height={6}
                  color={barColor}
                  trackColor={theme.colors.surfaceContainerHighest}
                />
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  cardExtra: {
    gap: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Entry rows
  entriesList: {
    gap: 0,
  },
  entryRow: {
    paddingVertical: 10,
  },
  entryRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  entryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  entryEmoji: {
    fontSize: 18,
  },
  entryName: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  entryAmounts: {
    fontSize: 13,
    fontWeight: '700',
  },
  entryBudget: {
    fontWeight: '500',
  },
});
