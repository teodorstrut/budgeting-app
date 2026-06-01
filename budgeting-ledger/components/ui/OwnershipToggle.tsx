import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

type OwnershipFilter = 'mine' | 'all';

interface OwnershipToggleProps {
  value: OwnershipFilter;
  onChange: (value: OwnershipFilter) => void;
}

export const OwnershipToggle: React.FC<OwnershipToggleProps> = ({ value, onChange }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.outlineVariant }]}>
      {(['mine', 'all'] as OwnershipFilter[]).map((option) => {
        const isActive = value === option;
        return (
          <TouchableOpacity
            key={option}
            style={[
              styles.option,
              isActive && { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => onChange(option)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                { color: isActive ? theme.colors.onPrimary : theme.colors.onSurfaceVariant },
              ]}
            >
              {option === 'mine' ? 'Mine' : 'All'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 9999,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
