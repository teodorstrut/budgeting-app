import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useTheme } from '../../providers/ThemeProvider';
import { EmptyState } from '../ui/EmptyState';

export interface BarDataPoint {
  /** Short label shown below the bar (e.g. "JAN") */
  label: string;
  value: number;
  /** Highlights the bar as the selected / current month */
  isCurrent: boolean;
}

interface SpendingBarChartProps {
  data: BarDataPoint[];
}

export const SpendingBarChart: React.FC<SpendingBarChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // 72 = 16*2 (scroll padding) + 20*2 (card padding)
  const chartWidth = screenWidth - 72;
  const BAR_WIDTH = 28;
  const EDGE_SPACING = 10;
  const barCount = data.length || 7;
  const spacing = Math.max(
    8,
    Math.floor((chartWidth - 2 * EDGE_SPACING - barCount * BAR_WIDTH) / (barCount - 1))
  );

  const isEmpty = data.every((d) => d.value === 0);

  if (isEmpty) {
    return (
      <EmptyState
        title="No data yet"
        subtitle="No spending recorded for the selected period."
      />
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  const barData = data.map((point) => ({
    value: point.value,
    frontColor: point.isCurrent ? theme.colors.primary : theme.colors.primary + '99',
    topLabelComponent: () => null,
    label: point.label.toUpperCase(),
    labelTextStyle: {
      color: point.isCurrent ? theme.colors.primary : theme.colors.onSurfaceVariant,
      fontSize: 10,
      fontWeight: point.isCurrent ? ('700' as const) : ('500' as const),
    },
  }));

  return (
    <View style={styles.wrapper}>
      <BarChart
        data={barData}
        maxValue={maxValue * 1.15}
        noOfSections={3}
        barWidth={BAR_WIDTH}
        barBorderTopLeftRadius={6}
        barBorderTopRightRadius={6}
        spacing={spacing}
        initialSpacing={EDGE_SPACING}
        endSpacing={EDGE_SPACING}
        rulesColor={theme.colors.surfaceContainerHigh}
        rulesType="solid"
        yAxisThickness={0}
        xAxisThickness={0}
        yAxisLabelWidth={0}
        hideYAxisText
        isAnimated
        animationDuration={600}
        height={160}
        width={chartWidth}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingTop: 8,
  },
});
