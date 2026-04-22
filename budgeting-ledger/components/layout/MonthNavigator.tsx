import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { useSharedStyles } from '../../theme/styles';

interface MonthNavigatorProps {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
}

export const MonthNavigator: React.FC<MonthNavigatorProps> = ({ label, onPrevious, onNext }) => {
  const { theme } = useTheme();
  const shared = useSharedStyles();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderColor: theme.colors.outlineVariant,
        },
      ]}
    >
      <TouchableOpacity
        style={[shared.buttons.iconButton, { backgroundColor: theme.colors.surfaceContainerHigh }]}
        onPress={onPrevious}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <FontAwesome name="chevron-left" size={14} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>

      <Text style={[styles.label, { color: theme.colors.primary }]}>{label}</Text>

      <TouchableOpacity
        style={[shared.buttons.iconButton, { backgroundColor: theme.colors.surfaceContainerHigh }]}
        onPress={onNext}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <FontAwesome name="chevron-right" size={14} color={theme.colors.onSurfaceVariant} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
