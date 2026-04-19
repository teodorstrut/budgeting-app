import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface ToggleOption<T extends string> {
  label: string;
  value: T;
}

interface ToggleButtonGroupProps<T extends string> {
  options: ToggleOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  activeColor: string;
  activeTextColor: string;
  inactiveTextColor: string;
  borderColor: string;
}

export function ToggleButtonGroup<T extends string>({
  options,
  selected,
  onSelect,
  activeColor,
  activeTextColor,
  inactiveTextColor,
  borderColor,
}: ToggleButtonGroupProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.button,
            {
              borderColor,
              backgroundColor: selected === option.value ? activeColor : 'transparent',
            },
          ]}
          onPress={() => onSelect(option.value)}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.buttonText,
              { color: selected === option.value ? activeTextColor : inactiveTextColor },
            ]}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
