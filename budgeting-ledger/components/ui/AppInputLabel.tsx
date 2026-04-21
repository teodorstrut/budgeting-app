import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface AppInputLabelProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const AppInputLabel: React.FC<AppInputLabelProps> = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
