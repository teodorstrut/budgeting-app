import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import type { BudgetHealthEntry } from '../../services/budgetService';

interface BudgetHealthWidgetProps {
  entries: BudgetHealthEntry[];
}

export const BudgetHealthWidget: React.FC<BudgetHealthWidgetProps> = ({ entries }) => {
  const { theme } = useTheme();
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
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      {/* Widget Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: onSurface }]}>Budget Health</Text>
        <TouchableOpacity
          style={[styles.seeAllPill, { backgroundColor: theme.colors.primaryContainer + '22' }]}
          onPress={() => router.push('/budget-health')}
          activeOpacity={0.8}
        >
          <Text style={[styles.seeAllText, { color: theme.colors.primary }]}>See all</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {isEmpty ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyTitle, { color: onSurface }]}>No transactions present</Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.onSurfaceVariant }]}>
            Start recording transactions in order to see a comparison with the configured budget
          </Text>
        </View>
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
                <View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceContainerHighest }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: barColor,
                        width: `${Math.min(ratio * 100, 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginTop: 16,
    marginBottom: 4,
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
  seeAllPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Empty state
  emptyContainer: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    lineHeight: 20,
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
  progressTrack: {
    height: 6,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 9999,
  },
});
