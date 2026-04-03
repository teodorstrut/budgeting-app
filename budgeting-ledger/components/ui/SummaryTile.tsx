import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../app/ThemeProvider';

interface SummaryTileProps {
  title: string;
  value: string;
  color?: string;
}

export const SummaryTile: React.FC<SummaryTileProps> = ({ title, value, color }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceContainer }]}>
      <Text style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>{title}</Text>
      <Text style={[styles.value, { color: color || theme.colors.primary }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    margin: 8,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
});