import React from 'react';
import { StyleSheet, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface AppSelectorFieldProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const AppSelectorField: React.FC<AppSelectorFieldProps> = ({ children, style, ...props }) => {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      {...props}
      style={[
        styles.field,
        {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderColor: theme.colors.outlineVariant,
        },
        style,
      ]}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 8,
  },
});
