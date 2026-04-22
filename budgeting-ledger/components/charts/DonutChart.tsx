import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { useTheme } from '../../providers/ThemeProvider';
import { EmptyState } from '../ui/EmptyState';

export const CHART_COLORS = [
  '#6feee1', // mint (primary)
  '#ffb866', // amber (secondary)
  '#ffa2c5', // pink (tertiary-container)
  '#4fd1c5', // teal (primary-container)
  '#5adace', // cyan (primary-fixed-dim)
  '#ffccdc', // light pink (tertiary)
];

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  totalLabel: string;
  totalValue: string;
  /** Diameter of the donut ring in dp. Defaults to 200. */
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalLabel,
  totalValue,
  size = 200,
}) => {
  const { theme } = useTheme();
  const isEmpty = data.length === 0 || data.every((d) => d.value === 0);

  if (isEmpty) {
    return (
      <EmptyState
        title="No expenses"
        subtitle="No expense transactions recorded this month."
      />
    );
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  const innerRadius = size * 0.3;
  const radius = size * 0.5;

  const pieData = data.map((slice) => ({
    value: slice.value,
    color: slice.color,
    text: '',
  }));

  return (
    <View style={styles.wrapper}>
      {/* Donut */}
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          donut
          radius={radius}
          innerRadius={innerRadius}
          innerCircleColor={theme.colors.surfaceContainerLow}
          focusOnPress={false}
          showText={false}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={[styles.centerLabelTitle, { color: theme.colors.onSurfaceVariant }]}>
                {totalLabel}
              </Text>
              <Text style={[styles.centerLabelValue, { color: theme.colors.onSurface }]}>
                {totalValue}
              </Text>
            </View>
          )}
        />
      </View>

      {/* Legend — 2-column grid, left-aligned within each column */}
      <View style={styles.legendWrapper}>
        <View style={styles.legend}>
          {data.map((slice, index) => {
            const pct = total > 0 ? Math.round((slice.value / total) * 100) : 0;
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                <Text
                  style={[styles.legendText, { color: theme.colors.onSurfaceVariant }]}
                  numberOfLines={1}
                >
                  {slice.label} ({pct}%)
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 20,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  centerLabelTitle: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
  centerLabelValue: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 2,
    letterSpacing: -0.5,
  },
  legendWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '50%',
    paddingRight: 8,
    paddingBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '500',
    flexShrink: 1,
  },
});
