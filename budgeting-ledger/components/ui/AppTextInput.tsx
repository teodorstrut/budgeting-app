import React from 'react';
import { StyleSheet, TextInput, TextInputProps, ViewStyle } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

interface AppTextInputProps extends TextInputProps {
  containerStyle?: ViewStyle;
}

export const AppTextInput = React.forwardRef<TextInput, AppTextInputProps>(
  ({ style, containerStyle: _containerStyle, ...props }, ref) => {
    const { theme } = useTheme();
    return (
      <TextInput
        ref={ref}
        placeholderTextColor={props.placeholderTextColor ?? theme.colors.outline}
        {...props}
        style={[
          styles.input,
          {
            backgroundColor: theme.colors.surfaceContainerLow,
            borderColor: theme.colors.outlineVariant,
            color: theme.colors.onSurface ?? theme.colors.onSurfaceVariant,
          },
          style,
        ]}
      />
    );
  }
);

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginTop: 8,
    fontSize: 15,
  },
});
